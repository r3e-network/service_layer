package postgres

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/R3E-Network/service_layer/internal/app/domain/account"
	"github.com/R3E-Network/service_layer/internal/app/domain/function"
	"github.com/R3E-Network/service_layer/internal/app/domain/gasbank"
	"github.com/R3E-Network/service_layer/internal/app/domain/trigger"
	_ "github.com/lib/pq"
)

func TestStoreIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_POSTGRES_DSN")
	if dsn == "" {
		t.Skip("TEST_POSTGRES_DSN not set; skipping postgres integration test")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	applyMigrations(t, db)
	resetTables(t, db)

	store := New(db)
	ctx := context.Background()

	acct, err := store.CreateAccount(ctx, account.Account{Owner: "owner"})
	if err != nil {
		t.Fatalf("create account: %v", err)
	}

	fn, err := store.CreateFunction(ctx, function.Definition{AccountID: acct.ID, Name: "fn", Source: "() => 1"})
	if err != nil {
		t.Fatalf("create function: %v", err)
	}

	trg := trigger.Trigger{AccountID: acct.ID, FunctionID: fn.ID, Rule: "cron:@hourly", Enabled: true}
	if _, err := store.CreateTrigger(ctx, trg); err != nil {
		t.Fatalf("create trigger: %v", err)
	}

	gasAcct, err := store.CreateGasAccount(ctx, gasbank.Account{
		AccountID:     acct.ID,
		WalletAddress: "NeOWallet",
	})
	if err != nil {
		t.Fatalf("create gas account: %v", err)
	}
	if gasAcct.ID == "" {
		t.Fatalf("expected gas account id to be set")
	}
	if gasAcct.CreatedAt.IsZero() || gasAcct.UpdatedAt.IsZero() {
		t.Fatalf("expected timestamps to be set on gas account")
	}
	if gasAcct.WalletAddress != strings.ToLower("NeOWallet") {
		t.Fatalf("wallet normalisation mismatch: %q", gasAcct.WalletAddress)
	}

	reloadedAcct, err := store.GetGasAccount(ctx, gasAcct.ID)
	if err != nil {
		t.Fatalf("get gas account: %v", err)
	}
	if reloadedAcct.ID != gasAcct.ID {
		t.Fatalf("expected matching gas account id")
	}

	byWallet, err := store.GetGasAccountByWallet(ctx, "NEOWALLET")
	if err != nil {
		t.Fatalf("get gas account by wallet: %v", err)
	}
	if byWallet.ID != gasAcct.ID {
		t.Fatalf("expected wallet lookup to match gas account")
	}

	accts, err := store.ListGasAccounts(ctx, acct.ID)
	if err != nil {
		t.Fatalf("list gas accounts: %v", err)
	}
	if len(accts) != 1 {
		t.Fatalf("expected single gas account, got %d", len(accts))
	}

	gasAcct.Balance = 10
	gasAcct.Available = 8
	gasAcct.Pending = 2
	gasAcct.DailyWithdrawal = 5
	gasAcct.LastWithdrawal = time.Now().UTC()
	gasAcct, err = store.UpdateGasAccount(ctx, gasAcct)
	if err != nil {
		t.Fatalf("update gas account: %v", err)
	}
	if gasAcct.UpdatedAt.Before(gasAcct.CreatedAt) {
		t.Fatalf("expected updated_at to be after created_at")
	}

	deposit := gasbank.Transaction{
		AccountID:      gasAcct.ID,
		UserAccountID:  acct.ID,
		Type:           gasbank.TransactionDeposit,
		Amount:         10,
		NetAmount:      10,
		Status:         gasbank.StatusCompleted,
		BlockchainTxID: "hash1",
		FromAddress:    "wallet-a",
		ToAddress:      "wallet-b",
	}
	deposit, err = store.CreateGasTransaction(ctx, deposit)
	if err != nil {
		t.Fatalf("create deposit transaction: %v", err)
	}
	if deposit.CreatedAt.IsZero() || deposit.UpdatedAt.IsZero() {
		t.Fatalf("expected timestamps to be set on deposit")
	}

	txs, err := store.ListGasTransactions(ctx, gasAcct.ID)
	if err != nil {
		t.Fatalf("list gas transactions: %v", err)
	}
	if len(txs) != 1 {
		t.Fatalf("expected single gas transaction, got %d", len(txs))
	}

	pending, err := store.ListPendingWithdrawals(ctx)
	if err != nil {
		t.Fatalf("list pending withdrawals: %v", err)
	}
	if len(pending) != 0 {
		t.Fatalf("expected no pending withdrawals, got %d", len(pending))
	}

	withdraw := gasbank.Transaction{
		AccountID:     gasAcct.ID,
		UserAccountID: acct.ID,
		Type:          gasbank.TransactionWithdrawal,
		Amount:        4,
		NetAmount:     4,
		Status:        gasbank.StatusPending,
		ToAddress:     "wallet-c",
	}
	withdraw, err = store.CreateGasTransaction(ctx, withdraw)
	if err != nil {
		t.Fatalf("create withdrawal transaction: %v", err)
	}

	pending, err = store.ListPendingWithdrawals(ctx)
	if err != nil {
		t.Fatalf("list pending withdrawals: %v", err)
	}
	if len(pending) != 1 || pending[0].ID != withdraw.ID {
		t.Fatalf("expected one pending withdrawal matching created transaction")
	}

	loadedWithdraw, err := store.GetGasTransaction(ctx, withdraw.ID)
	if err != nil {
		t.Fatalf("get gas transaction: %v", err)
	}
	if loadedWithdraw.Status != gasbank.StatusPending {
		t.Fatalf("expected pending status, got %s", loadedWithdraw.Status)
	}

	withdraw.Status = gasbank.StatusCompleted
	withdraw.CompletedAt = time.Now().UTC()
	withdraw.NetAmount = withdraw.Amount
	withdraw, err = store.UpdateGasTransaction(ctx, withdraw)
	if err != nil {
		t.Fatalf("update withdrawal transaction: %v", err)
	}
	if withdraw.Status != gasbank.StatusCompleted {
		t.Fatalf("expected status to remain completed")
	}

	pending, err = store.ListPendingWithdrawals(ctx)
	if err != nil {
		t.Fatalf("list pending withdrawals: %v", err)
	}
	if len(pending) != 0 {
		t.Fatalf("expected no pending withdrawals after settlement, got %d", len(pending))
	}
}

func applyMigrations(t *testing.T, db *sql.DB) {
	t.Helper()
	migrations := []string{
		"0001_app_core.sql",
		"0002_app_domain_tables.sql",
		"0003_app_gasbank.sql",
	}
	for _, name := range migrations {
		path := filepath.Join("..", "..", "..", "platform", "migrations", name)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("read migration %s: %v", name, err)
		}
		if _, err := db.Exec(string(content)); err != nil {
			t.Fatalf("apply migration %s: %v", name, err)
		}
	}
}

func resetTables(t *testing.T, db *sql.DB) {
	t.Helper()
	_, err := db.Exec(`
		TRUNCATE
			app_oracle_requests,
			app_oracle_sources,
			app_price_feed_snapshots,
			app_price_feeds,
			app_automation_jobs,
			app_triggers,
			app_functions,
			app_gas_transactions,
			app_gas_accounts,
			app_accounts
		RESTART IDENTITY CASCADE
	`)
	if err != nil {
		t.Fatalf("reset tables: %v", err)
	}
}
