import { Card, CardActions, CardContent, CardMedia, Button, Typography, Chip, Stack, Dialog, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { formatKES } from '../utils/currency';

// Responsive product card reused across list and home sections.
const ProductCard = ({ product }) => {
  const [openPreview, setOpenPreview] = useState(false);
  const fallbackImage = '/prime-favicon.svg';

  return (
    <>
      <Card
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: '0.2s',
          borderRadius: 2.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 24px rgba(2, 6, 23, 0.08)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 14px 30px rgba(2, 6, 23, 0.14)',
          },
        }}
      >
        <CardMedia
          component="img"
          image={product.images?.[0] || fallbackImage}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
          onDoubleClick={() => setOpenPreview(true)}
          sx={{ aspectRatio: '4 / 3', objectFit: 'cover', cursor: 'zoom-in' }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip size="small" label={product.category} />
            {product.featured && <Chip size="small" color="secondary" label="Featured" />}
          </Stack>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              minHeight: 64,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.name}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>Rating: {product.rating?.toFixed(1) || '0.0'}</Typography>
          <Typography variant="h6" color="primary">{formatKES(product.price)}</Typography>
        </CardContent>
        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <Button fullWidth variant="outlined" component={Link} to={`/product/${product._id}`}>
            View Details
          </Button>
        </CardActions>
      </Card>

      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => setOpenPreview(false)}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ px: 2, pb: 2 }}>
          <Box
            component="img"
            src={product.images?.[0] || fallbackImage}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
            sx={{ width: '100%', maxHeight: '75vh', objectFit: 'contain' }}
          />
        </Box>
      </Dialog>
    </>
  );
};

export default ProductCard;
