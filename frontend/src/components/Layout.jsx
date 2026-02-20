import { AppBar, Badge, Box, Button, Container, Divider, Drawer, IconButton, InputBase, List, ListItemButton, ListItemText, Toolbar, Tooltip, Typography } from '@mui/material';
import {
  ShoppingCart,
  Brightness4,
  Brightness7,
  Favorite,
  ArrowBack,
  Menu as MenuIcon,
  Dashboard,
  Category,
  Storefront,
  ChatBubbleOutline,
  Close,
  Send,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/authSlice';
import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import { formatKES } from '../utils/currency';

// Shared layout with top navigation, search, and footer.
const Layout = ({ children, mode, toggleTheme }) => {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [browseCategories, setBrowseCategories] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const quickPrompts = useMemo(
    () => [
      'Show product categories',
      'What offers are available?',
      'How do I become a seller?',
      'How do I track my order?',
      'Tell me about PRIME',
      'How do I contact support?',
    ],
    []
  );
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Hi, I am PRIME Assistant. Ask about products, categories, offers, orders, payments, delivery, returns, seller onboarding, and company info.',
    },
  ]);
  const [botTyping, setBotTyping] = useState(false);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  const firstName = user?.name ? String(user.name).trim().split(/\s+/)[0] : '';
  const cartItemsCount = useSelector((state) => state.cart.items.reduce((acc, item) => acc + item.quantity, 0));

  const onSearch = (event) => {
    event.preventDefault();
    navigate(`/products?keyword=${encodeURIComponent(keyword)}`);
    setShowSuggestions(false);
  };

  const onLogout = () => {
    dispatch(logoutUser());
  };

  useEffect(() => {
    const value = keyword.trim();
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/products', {
          params: { keyword: value, page: 1, limit: 6, sort: 'popularity' },
        });
        setSuggestions(data.products || []);
      } catch {
        setSuggestions([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get('/products', { params: { page: 1, limit: 120 } });
        const categories = [...new Set((data?.products || []).map((item) => item.category).filter(Boolean))];
        setBrowseCategories(categories.slice(0, 14));
      } catch {
        setBrowseCategories([]);
      }
    };
    loadCategories();
  }, []);

  const fallbackCategories = useMemo(
    () => ['Electronics', 'Fashion', 'Beauty', 'Home', 'Appliances', 'Gaming', 'Sports', 'Books'],
    []
  );
  const categoryList = browseCategories.length ? browseCategories : fallbackCategories;
  const showNavbarSearch = location.pathname === '/';
  const showQuickChat = user?.role !== 'admin' && (
    location.pathname === '/' ||
    location.pathname === '/products' ||
    location.pathname.startsWith('/product/') ||
    location.pathname === '/cart' ||
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/order/')
  );
  const buildBotReply = (message) => {
    const text = message.toLowerCase();
    if (text.includes('product') || text.includes('shop') || text.includes('browse')) {
      return 'To browse products, open Shop or go to /products. You can filter by category, price, rating, and sort by newest or best rated.';
    }
    if (text.includes('categor') || text.includes('department')) {
      return `Top categories include ${categoryList.slice(0, 6).join(', ')}. Open the menu icon to browse categories quickly or visit /products.`;
    }
    if (text.includes('offer') || text.includes('deal') || text.includes('discount') || text.includes('coupon') || text.includes('promo')) {
      return 'Active offers appear on the home banners and product cards. Check Home and Shop pages regularly for discounted items and promo campaigns.';
    }
    if (text.includes('company') || text.includes('about') || text.includes('prime')) {
      return 'PRIME is a modern multi-vendor marketplace focused on trusted products, secure checkout, and fast delivery. You can read more on the About page.';
    }
    if (text.includes('contact') || text.includes('email') || text.includes('phone') || text.includes('reach')) {
      return 'Use the Contact page for direct details, or open Support Center and submit a ticket. Include your Order ID for faster help.';
    }
    if (text.includes('order') || text.includes('track') || text.includes('status')) {
      return 'To track your order, open your profile and go to Orders. You can also check updates on the order confirmation page.';
    }
    if (text.includes('delivery') || text.includes('shipping')) {
      return 'Delivery fee and timing are shown at checkout. Choose your address, then you will see the estimated delivery total.';
    }
    if (text.includes('mpesa') || text.includes('m-pesa') || text.includes('stk') || text.includes('payment')) {
      return 'For M-Pesa STK, confirm the prompt on your phone. If it fails, verify your phone number format and try again.';
    }
    if (text.includes('refund') || text.includes('return')) {
      return 'For returns and refunds, open Support Center and submit a ticket with your Order ID for faster help.';
    }
    if (text.includes('sell') || text.includes('seller')) {
      return 'To sell on PRIME, open Sell from your menu, request seller access, then wait for admin approval.';
    }
    if (text.includes('cart') || text.includes('checkout') || text.includes('pay')) {
      return 'You can add multiple items to cart and pay selected items first, then return later for the rest. Checkout supports secure M-Pesa STK flow.';
    }
    if (text.includes('wishlist') || text.includes('favorite')) {
      return 'Save items using Wishlist, then open the wishlist icon in the top navbar to review and buy later.';
    }
    if (text.includes('account') || text.includes('profile') || text.includes('login') || text.includes('signup')) {
      return 'Use Profile to manage your details, addresses, and orders. If you are new, create an account from Signup in the top navbar.';
    }
    if (text.includes('privacy') || text.includes('terms') || text.includes('refund policy')) {
      return 'Legal pages are available in the footer: Privacy, Terms, and Refund Policy.';
    }
    if (text.includes('help') || text.includes('what can you do') || text.includes('menu')) {
      return 'I can help with: products, categories, offers, order tracking, payment, shipping, returns, seller onboarding, profile/account, and support contacts.';
    }
    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      return 'Hello. I can help with products, payment, orders, shipping, and seller setup.';
    }
    return 'I can help with products, categories, offers, company info, orders, delivery, M-Pesa payment, returns, and seller onboarding. Ask anything.';
  };
  const sendChatMessage = (messageOverride) => {
    const value = (messageOverride ?? chatMessage).trim();
    if (!value || botTyping) return;

    setChatMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', text: value }]);
    setChatMessage('');
    setBotTyping(true);

    const reply = buildBotReply(value);
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { id: `bot-${Date.now()}`, role: 'bot', text: reply }]);
      setBotTyping(false);
    }, 520);
  };

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatOpen, chatMessages, botTyping]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{ gap: 1, flexDirection: 'column', alignItems: 'stretch', py: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, minWidth: 0 }}>
            {user?.role !== 'admin' && (
              <IconButton color="inherit" onClick={() => setUserMenuOpen(true)} aria-label="Open browse menu">
                <MenuIcon />
              </IconButton>
            )}
            {user?.role === 'admin' && (
              <IconButton color="inherit" onClick={() => setAdminMenuOpen(true)} aria-label="Open admin menu">
                <MenuIcon />
              </IconButton>
            )}

            <Box
              component={Link}
              to="/"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: { xs: 0.5, md: 1 },
                color: 'primary.main',
                textDecoration: 'none',
                minWidth: 0,
                mr: { xs: 'auto', md: 0 },
              }}
            >
              <Box component="img" src="/prime-logo.svg" alt="Prime logo" sx={{ height: { xs: 22, md: 26 }, width: 'auto' }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1,
                  fontSize: { xs: '0.9rem', md: '1.25rem' },
                  whiteSpace: 'nowrap',
                }}
              >
                PRIME
              </Typography>
            </Box>

            {!isMobile && (
              <>
                {location.pathname !== '/' && (
                  <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                    Back
                  </Button>
                )}
                <Button component={Link} to="/">Home</Button>
                <Button component={Link} to="/products">Shop</Button>
                <Button component={Link} to="/support">Support</Button>
              </>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.2, md: 0.4 }, ml: { xs: 0, md: 'auto' }, flexShrink: 0 }}>
              {isMobile && location.pathname !== '/' && (
                <Tooltip title="Back">
                  <IconButton color="inherit" onClick={() => navigate(-1)} aria-label="Back">
                    <ArrowBack />
                  </IconButton>
                </Tooltip>
              )}

              <IconButton color="inherit" onClick={toggleTheme} aria-label="Toggle theme">
                {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
              </IconButton>

              {user?.role === 'admin' && (
                <Tooltip title="Dashboard">
                  <IconButton color="inherit" component={Link} to="/admin" aria-label="Dashboard">
                    <Dashboard />
                  </IconButton>
                </Tooltip>
              )}

              <IconButton color="inherit" component={Link} to="/wishlist" aria-label="Wishlist">
                <Favorite />
              </IconButton>

              <IconButton color="inherit" component={Link} to="/cart" aria-label="Cart">
                <Badge badgeContent={cartItemsCount} color="secondary">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            </Box>

            {!isMobile && user ? (
              <>
                <Button component={Link} to="/profile">{firstName || user.name}</Button>
                {user.role !== 'admin' && <Button component={Link} to="/seller">Sell</Button>}
                <Button color="error" onClick={onLogout}>Logout</Button>
              </>
            ) : null}

            {!isMobile && !user ? (
              <>
                <Button component={Link} to="/login">Login</Button>
                <Button variant="contained" component={Link} to="/signup">Signup</Button>
              </>
            ) : null}
          </Box>

          {showNavbarSearch && (
            <Box sx={{ width: '100%', position: 'relative' }}>
              <Box component="form" onSubmit={onSearch} sx={{ px: 1.5, py: 0.35, border: '1px solid', borderColor: 'divider', borderRadius: 999 }}>
                <InputBase
                  fullWidth
                  placeholder="Search products..."
                  value={keyword}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setShowSuggestions(true);
                  }}
                />
              </Box>
              {showSuggestions && suggestions.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    boxShadow: '0 14px 28px rgba(2,6,23,0.12)',
                    zIndex: 1200,
                    overflow: 'hidden',
                  }}
                >
                  {suggestions.map((item) => (
                    <Box
                      key={item._id}
                      component={Link}
                      to={`/product/${item._id}`}
                      onClick={() => setShowSuggestions(false)}
                      sx={{
                        display: 'block',
                        px: 1.5,
                        py: 1,
                        textDecoration: 'none',
                        color: 'text.primary',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatKES(item.price)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {user?.role === 'admin' && (
        <Drawer
          anchor="left"
          open={adminMenuOpen}
          onClose={() => setAdminMenuOpen(false)}
          PaperProps={{ sx: { width: 290 } }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0d9488' }}>PRIME</Typography>
            <Typography variant="caption" color="text.secondary">Admin Navigation</Typography>
          </Box>
          <Divider />
          <List sx={{ py: 0.5 }}>
            {[
              { label: 'Admin Dashboard', path: '/admin' },
              { label: 'User Management', path: '/admin' },
              { label: 'Seller Dashboard', path: '/admin/seller-dashboard' },
              { label: 'Reports', path: '/admin/reports' },
              { label: 'Logs', path: '/admin/logs' },
              { label: 'Coupons', path: '/admin/coupons' },
              { label: 'Tickets', path: '/admin/support-tickets' },
            ].map((item) => (
              <ListItemButton
                key={item.path + item.label}
                component={Link}
                to={item.path}
                onClick={() => setAdminMenuOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 0.5 }} />
            <ListItemButton
              onClick={() => {
                setAdminMenuOpen(false);
                onLogout();
              }}
            >
              <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error.main' }} />
            </ListItemButton>
          </List>
        </Drawer>
      )}

      {user?.role !== 'admin' && (
        <Drawer
          anchor="left"
          open={userMenuOpen}
          onClose={() => setUserMenuOpen(false)}
          PaperProps={{ sx: { width: 300 } }}
        >
          <Box sx={{ p: 2, background: 'linear-gradient(120deg, rgba(13,148,136,0.15), rgba(13,148,136,0.03))' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0d9488' }}>PRIME</Typography>
            <Typography variant="caption" color="text.secondary">Browse Categories</Typography>
          </Box>
          <Divider />
          <List sx={{ py: 0.5 }}>
            <ListItemButton component={Link} to="/" onClick={() => setUserMenuOpen(false)}>
              <ListItemText primary="Home" />
            </ListItemButton>
            <ListItemButton component={Link} to="/products" onClick={() => setUserMenuOpen(false)}>
              <Storefront fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText primary="All Products" />
            </ListItemButton>
            {categoryList.map((category) => (
              <ListItemButton
                key={category}
                component={Link}
                to={`/products?category=${encodeURIComponent(category)}`}
                onClick={() => setUserMenuOpen(false)}
              >
                <Category fontSize="small" style={{ marginRight: 8 }} />
                <ListItemText primary={category} />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 0.5 }} />
            {user && (
              <>
                <ListItemButton component={Link} to="/profile" onClick={() => setUserMenuOpen(false)}>
                  <ListItemText primary="My Profile" />
                </ListItemButton>
                {user.role !== 'admin' && (
                  <ListItemButton component={Link} to="/seller" onClick={() => setUserMenuOpen(false)}>
                    <ListItemText primary="Sell" />
                  </ListItemButton>
                )}
              </>
            )}
            {!user && (
              <>
                <ListItemButton component={Link} to="/login" onClick={() => setUserMenuOpen(false)}>
                  <ListItemText primary="Login" />
                </ListItemButton>
                <ListItemButton component={Link} to="/signup" onClick={() => setUserMenuOpen(false)}>
                  <ListItemText primary="Signup" />
                </ListItemButton>
              </>
            )}
            <ListItemButton component={Link} to="/support" onClick={() => setUserMenuOpen(false)}>
              <ListItemText primary="Support Center" />
            </ListItemButton>
            {user && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <ListItemButton
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                >
                  <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error.main' }} />
                </ListItemButton>
              </>
            )}
          </List>
        </Drawer>
      )}

      <Container sx={{ py: 3, flex: 1 }}>{children}</Container>

      {showQuickChat && (
        <Box
          sx={{
            position: 'fixed',
            right: { xs: 12, md: 18 },
            bottom: { xs: 12, md: 18 },
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          {chatOpen && (
            <Box
              sx={{
                width: { xs: 'min(92vw, 340px)', md: 360 },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: '0 20px 40px rgba(2, 6, 23, 0.18)',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ px: 1.5, py: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(13,148,136,0.08)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>PRIME Assistant</Typography>
                <IconButton size="small" onClick={() => setChatOpen(false)} aria-label="Close chat">
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ px: 1.5, pt: 1.3, pb: 1 }}>
                <Box sx={{ mb: 1 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowQuickPrompts((value) => !value)}
                    endIcon={showQuickPrompts ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    sx={{ textTransform: 'none', px: 0.4, minWidth: 0, fontWeight: 600 }}
                  >
                    Suggestions
                  </Button>
                  {showQuickPrompts && (
                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 0.8 }}>
                      {quickPrompts.map((prompt) => (
                        <Button
                          key={prompt}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 999, textTransform: 'none', fontSize: 12, px: 1.1, py: 0.25 }}
                          onClick={() => sendChatMessage(prompt)}
                          disabled={botTyping}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </Box>
                  )}
                </Box>
                <Box
                  sx={{
                    mb: 1,
                    height: 230,
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1,
                    bgcolor: 'rgba(2, 6, 23, 0.02)',
                  }}
                >
                  {chatMessages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        mb: 1,
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Box
                        sx={{
                          px: 1.2,
                          py: 0.8,
                          borderRadius: 1.8,
                          maxWidth: '86%',
                          fontSize: 13,
                          lineHeight: 1.45,
                          bgcolor: msg.role === 'user' ? '#0d9488' : 'background.paper',
                          color: msg.role === 'user' ? 'common.white' : 'text.primary',
                          border: msg.role === 'user' ? 'none' : '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {msg.text}
                      </Box>
                    </Box>
                  ))}
                  {botTyping && (
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-start' }}>
                      <Box sx={{ px: 1.2, py: 0.8, borderRadius: 1.8, fontSize: 13, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        PRIME Assistant is typing...
                      </Box>
                    </Box>
                  )}
                  <Box ref={chatEndRef} />
                </Box>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1, py: 0.8, mb: 1 }}>
                  <InputBase
                    fullWidth
                    placeholder="Type your question..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button size="small" component={Link} to="/support" onClick={() => setChatOpen(false)}>
                    Open Support Center
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    endIcon={<Send fontSize="small" />}
                    disabled={!chatMessage.trim() || botTyping}
                    onClick={sendChatMessage}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          <IconButton
            aria-label="Open quick chat"
            onClick={() => setChatOpen((value) => !value)}
            sx={{
              width: 54,
              height: 54,
              color: 'common.white',
              bgcolor: '#0d9488',
              boxShadow: '0 12px 24px rgba(13,148,136,0.38)',
              '&:hover': { bgcolor: '#0f766e' },
            }}
          >
            <ChatBubbleOutline />
          </IconButton>
        </Box>
      )}

      <Box component="footer" sx={{ py: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
          <Button size="small" component={Link} to="/privacy">Privacy</Button>
          <Button size="small" component={Link} to="/terms">Terms</Button>
          <Button size="small" component={Link} to="/refund-policy">Refund Policy</Button>
          <Button size="small" component={Link} to="/contact">Contact</Button>
          <Button size="small" component={Link} to="/about">About</Button>
          <Button size="small" component={Link} to="/support">Support Center</Button>
        </Box>
        <Typography variant="body2">© {new Date().getFullYear()} Prime Store</Typography>
      </Box>
    </Box>
  );
};

export default Layout;
