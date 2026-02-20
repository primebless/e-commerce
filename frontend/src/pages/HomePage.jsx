import { Box, Button, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../features/productsSlice';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import api from '../api/client';

// Landing page with hero, featured products, and category shortcuts.
const HomePage = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.products);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 8, sort: 'rating' }));
    const loadBanners = async () => {
      try {
        const { data } = await api.get('/promotions/banners');
        setBanners(data || []);
      } catch {
        setBanners([]);
      }
    };
    loadBanners();
  }, [dispatch]);

  const featured = items.filter((product) => product.featured).slice(0, 4);
  const categories = [...new Set(items.map((p) => p.category))].slice(0, 6);

  return (
    <>
      <Helmet>
        <title>Prime Store | Home</title>
        <meta name="description" content="Shop the best fashion, electronics, and more" />
      </Helmet>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          px: { xs: 3, md: 8 },
          py: { xs: 6, md: 9 },
          mb: 2,
          color: 'white',
          overflow: 'hidden',
          boxShadow: 'none',
          background:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2), transparent 35%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.16), transparent 25%), linear-gradient(110deg, #0f766e 0%, #065f46 45%, #ea580c 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            top: -1,
            height: { xs: 36, md: 60 },
            pointerEvents: 'none',
            background: (theme) => `linear-gradient(to top, rgba(255,255,255,0), ${theme.palette.background.default})`,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            height: { xs: 48, md: 84 },
            pointerEvents: 'none',
            background: (theme) => `linear-gradient(to bottom, rgba(255,255,255,0), ${theme.palette.background.default})`,
          },
        }}
      >
        <Typography sx={{ opacity: 0.9, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 12 }}>
          Prime Store
        </Typography>
        <Typography variant="h2" sx={{ mt: 1, fontWeight: 900, lineHeight: 1.05, fontSize: { xs: '2rem', md: '3.8rem' }, maxWidth: 980 }}>
          Everything You Need, All In One Place
        </Typography>
        <Typography sx={{ mt: 1.5, mb: 3, fontSize: { xs: '1rem', md: '1.15rem' }, maxWidth: 760, opacity: 0.95 }}>
          Discover trusted brands, fast delivery, secure checkout, and deals worth checking every day.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 3 }}>
          <Box sx={{ px: 1.5, py: 0.7, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>Fast Delivery</Box>
          <Box sx={{ px: 1.5, py: 0.7, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>Secure Payments</Box>
          <Box sx={{ px: 1.5, py: 0.7, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>Top Rated Products</Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
          <Button variant="contained" color="secondary" component={Link} to="/products">
            Shop Now
          </Button>
          <Button
            variant="outlined"
            component={Link}
            to="/products?sort=rating"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.7)' }}
          >
            Explore Best Sellers
          </Button>
        </Box>
      </Box>

      <Box sx={{ py: { xs: 1, md: 2 } }}>
        {banners.length > 0 && (
          <Grid2 container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 3 }}>
            {banners.map((banner) => (
              <Grid2 key={banner.id} size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    color: 'white',
                    background: `linear-gradient(120deg, ${banner.color}, #0f172a)`,
                  }}
                >
                  <Typography variant="h6">{banner.title}</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>{banner.subtitle}</Typography>
                  <Button size="small" variant="contained" component={Link} to={banner.cta}>
                    Shop Deal
                  </Button>
                </Box>
              </Grid2>
            ))}
          </Grid2>
        )}
        <Typography variant="h5" sx={{ mb: 2.2 }}>Featured Products</Typography>
        <Grid2 container spacing={{ xs: 2, md: 2.5 }} sx={{ mb: 4 }}>
          {(featured.length ? featured : items.slice(0, 4)).map((product) => (
            <Grid2 key={product._id} size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
              <ProductCard product={product} />
            </Grid2>
          ))}
        </Grid2>
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>Browse Categories</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
        {categories.map((category) => (
          <Button key={category} variant="outlined" component={Link} to={`/products?category=${encodeURIComponent(category)}`}>
            {category}
          </Button>
        ))}
      </Box>
    </>
  );
};

export default HomePage;
