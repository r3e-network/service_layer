package cache

import (
	"context"
	"sync"
	"time"
)

type CacheEntry struct {
	Value      interface{}
	Expiration time.Time
	Version    int64
}

type CacheConfig struct {
	DefaultTTL      time.Duration
	MaxSize         int
	CleanupInterval time.Duration
}

func DefaultConfig() CacheConfig {
	return CacheConfig{
		DefaultTTL:      5 * time.Minute,
		MaxSize:         1000,
		CleanupInterval: 10 * time.Minute,
	}
}

type Cache struct {
	mu      sync.RWMutex
	entries map[string]*CacheEntry
	config  CacheConfig
	version int64
}

func NewCache(cfg CacheConfig) *Cache {
	if cfg.DefaultTTL == 0 {
		cfg.DefaultTTL = 5 * time.Minute
	}
	if cfg.MaxSize == 0 {
		cfg.MaxSize = 1000
	}
	if cfg.CleanupInterval == 0 {
		cfg.CleanupInterval = 10 * time.Minute
	}

	c := &Cache{
		entries: make(map[string]*CacheEntry),
		config:  cfg,
	}

	go c.startCleanup()
	return c
}

func (c *Cache) startCleanup() {
	ticker := time.NewTicker(c.config.CleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		c.cleanup()
	}
}

func (c *Cache) cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	expired := 0
	size := len(c.entries)

	for key, entry := range c.entries {
		if now.After(entry.Expiration) {
			delete(c.entries, key)
			expired++
		}
	}

	if expired > 0 || size > c.config.MaxSize {
		size = len(c.entries)
	}
}

func (c *Cache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, ok := c.entries[key]
	if !ok {
		return nil, false
	}

	if time.Now().After(entry.Expiration) {
		return nil, false
	}

	return entry.Value, true
}

func (c *Cache) GetVersion(key string) (interface{}, int64, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, ok := c.entries[key]
	if !ok {
		return nil, 0, false
	}

	if time.Now().After(entry.Expiration) {
		return nil, 0, false
	}

	return entry.Value, entry.Version, true
}

func (c *Cache) Set(key string, value interface{}, ttl time.Duration) {
	if ttl == 0 {
		ttl = c.config.DefaultTTL
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries[key] = &CacheEntry{
		Value:      value,
		Expiration: time.Now().Add(ttl),
		Version:    c.version,
	}
}

func (c *Cache) SetVersioned(key string, value interface{}, ttl time.Duration) {
	if ttl == 0 {
		ttl = c.config.DefaultTTL
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries[key] = &CacheEntry{
		Value:      value,
		Expiration: time.Now().Add(ttl),
		Version:    c.version,
	}
}

func (c *Cache) Invalidate(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.entries, key)
}

func (c *Cache) InvalidatePattern(pattern string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.entries {
		if len(key) >= len(pattern) && key[:len(pattern)] == pattern {
			delete(c.entries, key)
		}
	}
}

func (c *Cache) InvalidateAll() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries = make(map[string]*CacheEntry)
}

func (c *Cache) InvalidateVersion() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.version++
	c.entries = make(map[string]*CacheEntry)
}

func (c *Cache) InvalidateByVersion(targetVersion int64) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if targetVersion >= c.version {
		return
	}

	c.version = targetVersion
	c.entries = make(map[string]*CacheEntry)
}

func (c *Cache) GetCurrentVersion() int64 {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return c.version
}

func (c *Cache) Size() int {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return len(c.entries)
}

type TokenCache struct {
	cache     *Cache
	keyPrefix string
}

func NewTokenCache(cfg CacheConfig) *TokenCache {
	return &TokenCache{
		cache:     NewCache(cfg),
		keyPrefix: "token:",
	}
}

func (c *TokenCache) GetToken(tokenHash string) (interface{}, bool) {
	return c.cache.Get(c.keyPrefix + tokenHash)
}

func (c *TokenCache) SetToken(tokenHash string, value interface{}, ttl time.Duration) {
	c.cache.Set(c.keyPrefix+tokenHash, value, ttl)
}

func (c *TokenCache) InvalidateToken(tokenHash string) {
	c.cache.Invalidate(c.keyPrefix + tokenHash)
}

func (c *TokenCache) InvalidateAllTokens() {
	c.cache.InvalidatePattern(c.keyPrefix)
}

func (c *TokenCache) InvalidateAll() {
	c.cache.InvalidateAll()
}

func (c *TokenCache) OnKeyRotation() {
	c.cache.InvalidateVersion()
}

type TTLCache struct {
	cache     *Cache
	keyPrefix string
}

func NewTTLCache(ttl time.Duration) *TTLCache {
	return &TTLCache{
		cache:     NewCache(CacheConfig{DefaultTTL: ttl}),
		keyPrefix: "ttl:",
	}
}

func (c *TTLCache) Get(ctx context.Context, key string) (interface{}, bool) {
	return c.cache.Get(c.keyPrefix + key)
}

func (c *TTLCache) Set(ctx context.Context, key string, value interface{}) {
	c.cache.Set(c.keyPrefix+key, value, 0)
}

func (c *TTLCache) Delete(ctx context.Context, key string) {
	c.cache.Invalidate(c.keyPrefix + key)
}

func (c *TTLCache) InvalidateAll() {
	c.cache.InvalidatePattern(c.keyPrefix)
}
