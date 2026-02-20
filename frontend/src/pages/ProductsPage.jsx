import { Box, FormControl, InputLabel, MenuItem, Pagination, Select, Slider, TextField, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../features/productsSlice';

// Product listing page with filters, sorting, and pagination.
const ProductsPage = () => {
  const dispatch = useDispatch();
  const { items, page, pages, loading } = useSelector((state) => state.products);
  const [searchParams, setSearchParams] = useSearchParams();

  const keywordParam = searchParams.get('keyword') || '';
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const minRatingParam = searchParams.get('minRating') || '';
  const pageParam = Number(searchParams.get('page') || 1);
  const [priceRange, setPriceRange] = useState([0, 2000]);

  useEffect(() => {
    dispatch(
      fetchProducts({
        page: pageParam,
        keyword: keywordParam,
        category: categoryParam,
        sort: sortParam,
        minRating: minRatingParam,
        limit: 10,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
      })
    );
  }, [dispatch, pageParam, keywordParam, categoryParam, sortParam, minRatingParam, priceRange]);

  const categories = useMemo(() => [...new Set(items.map((p) => p.category))], [items]);

  const updateQuery = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <>
      <Helmet><title>Prime Store | Products</title></Helmet>
      <Typography variant="h4" sx={{ mb: 2 }}>Products</Typography>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' }, mb: 3 }}>
        <TextField
          label="Search"
          value={keywordParam}
          onChange={(e) => updateQuery('keyword', e.target.value)}
        />

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={categoryParam}
            onChange={(e) => updateQuery('category', e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Sort</InputLabel>
          <Select label="Sort" value={sortParam} onChange={(e) => updateQuery('sort', e.target.value)}>
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="popularity">Popularity</MenuItem>
            <MenuItem value="price_asc">Price: Low to High</MenuItem>
            <MenuItem value="price_desc">Price: High to Low</MenuItem>
            <MenuItem value="rating">Top Rated</MenuItem>
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Min Rating</InputLabel>
          <Select label="Min Rating" value={minRatingParam} onChange={(e) => updateQuery('minRating', e.target.value)}>
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="4">4+</MenuItem>
            <MenuItem value="3">3+</MenuItem>
            <MenuItem value="2">2+</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography gutterBottom>Price Range (KES {priceRange[0]} - KES {priceRange[1]})</Typography>
      <Slider value={priceRange} onChange={(_, value) => setPriceRange(value)} valueLabelDisplay="auto" max={3000} sx={{ mb: 3 }} />

      {loading ? (
        <Typography>Loading products...</Typography>
      ) : (
        <Grid2 container spacing={2}>
          {items.map((product) => (
            <Grid2 key={product._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ProductCard product={product} />
            </Grid2>
          ))}
        </Grid2>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          page={page}
          count={pages}
          onChange={(_, value) => updateQuery('page', String(value))}
        />
      </Box>
    </>
  );
};

export default ProductsPage;
