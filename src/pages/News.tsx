import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Calendar, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
}

const News = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    
    if (data) {
      setArticles(data);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      <main className="pt-20 pb-24">
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">
              LATEST NEWS
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay updated with The General Da Jamaican Boy
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No News Yet</h3>
              <p className="text-muted-foreground">Check back soon for updates!</p>
            </div>
          ) : selectedArticle ? (
            <article className="max-w-3xl mx-auto">
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-primary hover:underline mb-6 inline-block"
              >
                ← Back to all news
              </button>
              {selectedArticle.image_url && (
                <img
                  src={selectedArticle.image_url}
                  alt={selectedArticle.title}
                  className="w-full aspect-video object-cover rounded-2xl mb-6"
                />
              )}
              <div className="flex items-center gap-4 text-muted-foreground text-sm mb-4">
                {selectedArticle.category && (
                  <span className="flex items-center gap-1 text-primary">
                    <Tag className="w-4 h-4" />
                    {selectedArticle.category}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedArticle.published_at || selectedArticle.created_at)}
                </span>
              </div>
              <h1 className="font-display text-4xl text-foreground mb-6">
                {selectedArticle.title}
              </h1>
              <div className="prose prose-invert max-w-none">
                {selectedArticle.content?.split('\n').map((paragraph, i) => (
                  <p key={i} className="text-muted-foreground mb-4">{paragraph}</p>
                ))}
              </div>
            </article>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="group text-left bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all"
                >
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-rasta-red via-primary to-rasta-green" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      {article.category && (
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                          {article.category}
                        </span>
                      )}
                      <span>{formatDate(article.published_at || article.created_at)}</span>
                    </div>
                    <h3 className="font-display text-xl text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-3">{article.excerpt}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default News;
