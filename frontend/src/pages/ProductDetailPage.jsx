import { Alert, Box, Button, Chip, Dialog, IconButton, MenuItem, Paper, Rating, Select, Stack, TextField, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { ArrowBack, ArrowForward, Close, ZoomIn, ZoomOut } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import Grid2 from '@mui/material/Grid2';
import { addToCart, setCartItems } from '../features/cartSlice';
import { createReview, fetchProductDetail } from '../features/productsSlice';
import ProductCard from '../components/ProductCard';
import api from '../api/client';
import { formatKES } from '../utils/currency';

// Product details with image carousel, reviews, add-to-cart, and related products.
const ProductDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { productDetail } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);

  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [notice, setNotice] = useState('');
  const [openGallery, setOpenGallery] = useState(false);
  const [zoom, setZoom] = useState(1);
  const fallbackImage = '/prime-favicon.svg';

  useEffect(() => {
    dispatch(fetchProductDetail(id));
  }, [dispatch, id]);

  const product = productDetail?.product;
  const images = useMemo(() => product?.images || [], [product]);

  if (!product) return <Typography>Loading product...</Typography>;

  const addCartHandler = () => {
    const run = async () => {
      if (user?.token) {
        const { data } = await api.post('/cart/item', { productId: product._id, quantity });
        dispatch(setCartItems(data.items));
      } else {
        dispatch(
          addToCart({
            product: product._id,
            name: product.name,
            image: product.images[0],
            price: product.price,
            quantity,
          })
        );
      }
      setNotice('Item added to cart');
    };

    run();
  };

  const submitReview = async (event) => {
    event.preventDefault();
    await dispatch(createReview({ id: product._id, rating, comment }));
    setComment('');
    dispatch(fetchProductDetail(id));
  };

  const toggleWishlist = async () => {
    await api.post('/users/wishlist/toggle', { productId: product._id });
    setNotice('Wishlist updated');
  };

  const nextImage = () => setImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const openGalleryView = () => {
    setOpenGallery(true);
    setZoom(1);
  };

  return (
    <>
      <Helmet><title>{product.name} | Prime Store</title></Helmet>
      {notice && <Alert sx={{ mb: 2 }}>{notice}</Alert>}

      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <img
                src={images[imageIndex] || fallbackImage}
                alt={product.name}
                style={{ width: '100%', borderRadius: 12, maxHeight: 460, objectFit: 'cover', cursor: 'zoom-in' }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = fallbackImage;
                }}
                onClick={openGalleryView}
              />
              {images.length > 1 && (
                <>
                  <IconButton sx={{ position: 'absolute', top: '45%', left: 8, bgcolor: 'background.paper' }} onClick={prevImage}>
                    <ArrowBack />
                  </IconButton>
                  <IconButton sx={{ position: 'absolute', top: '45%', right: 8, bgcolor: 'background.paper' }} onClick={nextImage}>
                    <ArrowForward />
                  </IconButton>
                </>
              )}
            </Box>
            {images.length > 1 && (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  mt: 1.5,
                  overflowX: 'auto',
                  pb: 0.5,
                  '&::-webkit-scrollbar': { height: 6 },
                }}
              >
                {images.map((img, idx) => (
                  <Box
                    key={img}
                    onClick={() => setImageIndex(idx)}
                    sx={{
                      minWidth: 84,
                      width: 84,
                      height: 84,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor: imageIndex === idx ? 'primary.main' : 'transparent',
                      cursor: 'pointer',
                      opacity: imageIndex === idx ? 1 : 0.75,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box
                      component="img"
                      src={img || fallbackImage}
                      alt={`${product.name} ${idx + 1}`}
                      onError={(e) => {
                        e.currentTarget.src = fallbackImage;
                      }}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <Typography variant="h4">{product.name}</Typography>
          <Typography color="text.secondary" sx={{ my: 1 }}>{product.description}</Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>Seller: {product.brand || 'Prime Store'}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Availability: {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
          </Typography>
          <Rating value={product.rating || 0} readOnly precision={0.5} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
            <Typography variant="h5">{formatKES(product.price)}</Typography>
            {product.rating >= 4.5 && <Chip size="small" color="secondary" label="Top Deal" />}
          </Box>

          <Select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} sx={{ minWidth: 100, mr: 2 }}>
            {[...Array(Math.min(product.countInStock, 10)).keys()].map((num) => (
              <MenuItem key={num + 1} value={num + 1}>{num + 1}</MenuItem>
            ))}
          </Select>
          <Button variant="contained" onClick={addCartHandler} disabled={product.countInStock < 1}>Add to Cart</Button>
          <Button variant="text" onClick={toggleWishlist} sx={{ ml: 1 }}>Toggle Wishlist</Button>

          <Box component="form" onSubmit={submitReview} sx={{ mt: 4 }}>
            <Typography variant="h6">Write a Review</Typography>
            {!user && <Typography variant="body2">Please login to post a review.</Typography>}
            <Rating value={rating} onChange={(_, value) => setRating(value || 5)} />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ my: 1 }}
            />
            <Button type="submit" disabled={!user} variant="outlined">Submit Review</Button>
          </Box>
        </Grid2>
      </Grid2>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Related Products</Typography>
        <Grid2 container spacing={2}>
          {productDetail.relatedProducts?.map((item) => (
            <Grid2 key={item._id} size={{ xs: 12, sm: 6, md: 3 }}>
              <ProductCard product={item} />
            </Grid2>
          ))}
        </Grid2>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>Customer Reviews</Typography>
        {productDetail.reviews?.map((review) => (
          <Paper key={review._id} sx={{ p: 2, mb: 1 }}>
            <Typography variant="subtitle2">{review.user?.name}</Typography>
            <Rating size="small" readOnly value={review.rating} />
            <Typography variant="body2">{review.comment}</Typography>
          </Paper>
        ))}
      </Box>

      <Button component={Link} to="/products" sx={{ mt: 2 }}>Back to Products</Button>

      <Dialog open={openGallery} onClose={() => setOpenGallery(false)} maxWidth="lg" fullWidth>
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">{product.name}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={() => setZoom((prev) => Math.max(1, prev - 0.25))}><ZoomOut /></IconButton>
            <IconButton onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}><ZoomIn /></IconButton>
            <IconButton onClick={() => setOpenGallery(false)}><Close /></IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 2, pb: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 420, position: 'relative', overflow: 'auto' }}>
          {images.length > 1 && (
            <IconButton sx={{ position: 'absolute', left: 10, zIndex: 2, bgcolor: 'background.paper' }} onClick={prevImage}>
              <ArrowBack />
            </IconButton>
          )}
          <Box
            component="img"
            src={images[imageIndex] || fallbackImage}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
            sx={{
              width: '100%',
              maxHeight: 560,
              objectFit: 'contain',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
            }}
          />
          {images.length > 1 && (
            <IconButton sx={{ position: 'absolute', right: 10, zIndex: 2, bgcolor: 'background.paper' }} onClick={nextImage}>
              <ArrowForward />
            </IconButton>
          )}
        </Box>

        {images.length > 1 && (
          <Stack direction="row" spacing={1} sx={{ px: 2, pb: 2, overflowX: 'auto' }}>
            {images.map((img, idx) => (
              <Box
                key={`${img}-modal`}
                onClick={() => {
                  setImageIndex(idx);
                  setZoom(1);
                }}
                sx={{
                  minWidth: 72,
                  width: 72,
                  height: 72,
                  borderRadius: 1.25,
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: imageIndex === idx ? 'primary.main' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Box
                  component="img"
                  src={img || fallbackImage}
                  alt={`${product.name} preview ${idx + 1}`}
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Dialog>
    </>
  );
};

export default ProductDetailPage;
