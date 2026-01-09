// Neo News Today MiniApp
(function() {
  'use strict';

  const articlesContainer = document.getElementById('articles');
  const iframeContainer = document.getElementById('iframe-container');
  const articleIframe = document.getElementById('article-iframe');
  const externalLink = document.getElementById('external-link');
  const backBtn = document.getElementById('back-btn');

  // Event listeners
  backBtn.addEventListener('click', closeArticle);

  // Load articles on init
  loadArticles();

  // Check URL params for direct article link
  const params = new URLSearchParams(window.location.search);
  const articleUrl = params.get('article');
  if (articleUrl) {
    openArticle(decodeURIComponent(articleUrl));
  }

  async function loadArticles() {
    try {
      const res = await fetch('/api/nnt-news?limit=15');
      const data = await res.json();
      renderArticles(data.articles || []);
    } catch (e) {
      showError('Failed to load articles');
    }
  }

  function renderArticles(articles) {
    articlesContainer.textContent = '';

    if (!articles.length) {
      showError('No articles found');
      return;
    }

    articles.forEach(function(article) {
      const el = createArticleElement(article);
      articlesContainer.appendChild(el);
    });
  }

  function createArticleElement(article) {
    const div = document.createElement('div');
    div.className = 'article';
    div.addEventListener('click', function() {
      openArticle(article.link);
    });

    const content = document.createElement('div');
    content.className = 'article-content';

    if (article.imageUrl) {
      const img = document.createElement('img');
      img.className = 'article-image';
      img.src = article.imageUrl;
      img.alt = '';
      img.loading = 'lazy';
      content.appendChild(img);
    }

    const textDiv = document.createElement('div');
    textDiv.className = 'article-text';

    const title = document.createElement('div');
    title.className = 'article-title';
    title.textContent = article.title;
    textDiv.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'article-meta';

    const cat = document.createElement('span');
    cat.className = 'category';
    cat.textContent = article.category || 'News';
    meta.appendChild(cat);

    const date = document.createElement('span');
    date.textContent = formatDate(article.pubDate);
    meta.appendChild(date);

    textDiv.appendChild(meta);
    content.appendChild(textDiv);
    div.appendChild(content);

    return div;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function openArticle(url) {
    iframeContainer.style.display = 'block';
    articleIframe.src = url;
    externalLink.href = url;
  }

  function closeArticle() {
    iframeContainer.style.display = 'none';
    articleIframe.src = '';
  }

  function showError(msg) {
    const div = document.createElement('div');
    div.className = 'loading';
    div.textContent = msg;
    articlesContainer.textContent = '';
    articlesContainer.appendChild(div);
  }
})();
