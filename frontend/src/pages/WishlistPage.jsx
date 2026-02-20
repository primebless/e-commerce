import { Box, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';

// Wishlist management page for authenticated users.
const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const loadWishlist = async () => {
      const { data } = await api.get('/users/wishlist');
      setWishlist(data);
    };
    loadWishlist();
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Wishlist</Typography>
      <Grid2 container spacing={2}>
        {wishlist.map((product) => (
          <Grid2 key={product._id} size={{ xs: 12, sm: 6, md: 3 }}>
            <ProductCard product={product} />
          </Grid2>
        ))}
      </Grid2>
    </Box>
  );
};

export default WishlistPage;
