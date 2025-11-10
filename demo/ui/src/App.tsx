import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Slider,
} from '@mui/material';
import {
  ShoppingCart,
  Timeline,
  Speed,
  Architecture,
  History,
  CheckCircle,
  Cancel,
  Pending,
} from '@mui/icons-material';
import './App.css';

// Configuration
const API_URL = process.env.REACT_APP_API_URL || 'https://your-api.execute-api.us-east-1.amazonaws.com/prod';
const WS_URL = process.env.REACT_APP_WS_URL || 'wss://your-ws.execute-api.us-east-1.amazonaws.com/prod';

interface Order {
  orderId: string;
  customerId: string;
  status: 'PLACED' | 'CANCELLED' | 'COMPLETED';
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  placedAt: string;
  cancelledAt?: string;
  version: number;
}

interface Event {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateVersion: number;
  timestamp: string;
  payload: any;
  metadata: any;
}

interface Metrics {
  commandLatency: number;
  eventLatency: number;
  queryLatency: number;
  totalEvents: number;
  successRate: number;
}

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    commandLatency: 0,
    eventLatency: 0,
    queryLatency: 0,
    totalEvents: 0,
    successRate: 100,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [placeOrderDialog, setPlaceOrderDialog] = useState(false);
  const [temporalTime, setTemporalTime] = useState(Date.now());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);

      if (data.type === 'ORDER_UPDATED') {
        // Refresh orders
        fetchOrders();
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/queries`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events`);
      const data = await response.json();
      setEvents(data.events || []);
      setMetrics((prev) => ({ ...prev, totalEvents: data.events?.length || 0 }));
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders();
    fetchEvents();
  }, []);

  // Place order
  const placeOrder = async (orderData: any) => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await fetch(`${API_URL}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandType: 'PlaceOrder',
          ...orderData,
        }),
      });

      if (!response.ok) throw new Error('Failed to place order');

      const result = await response.json();
      const latency = Date.now() - startTime;

      setMetrics((prev) => ({ ...prev, commandLatency: latency }));
      setSuccess(`Order placed successfully! (${latency}ms)`);
      setPlaceOrderDialog(false);

      // Refresh data
      setTimeout(() => {
        fetchOrders();
        fetchEvents();
      }, 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel order
  const cancelOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandType: 'CancelOrder',
          orderId,
        }),
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      setSuccess('Order cancelled successfully!');

      // Refresh data
      setTimeout(() => {
        fetchOrders();
        fetchEvents();
      }, 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Temporal query
  const fetchTemporalState = async (orderId: string, timestamp: number) => {
    try {
      const response = await fetch(
        `${API_URL}/temporal/${orderId}?asOf=${new Date(timestamp).toISOString()}`
      );
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching temporal state:', err);
      return null;
    }
  };

  // Simulate load
  const simulateLoad = async () => {
    setLoading(true);
    setSuccess('Simulating 100 orders...');

    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        placeOrder({
          orderId: `load-test-${Date.now()}-${i}`,
          customerId: `customer-${i}`,
          totalAmount: Math.random() * 1000,
          items: [
            {
              productId: `product-${i % 10}`,
              quantity: Math.floor(Math.random() * 5) + 1,
              price: Math.random() * 100,
            },
          ],
        })
      );
    }

    await Promise.all(promises);
    setSuccess('Load test complete! 100 orders processed.');
    setLoading(false);
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
            Nexus Blueprint 3.0 Demo
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Real-Time Event-Sourced Order Management
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Chip
              label={connected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
              color={connected ? 'success' : 'error'}
              size="small"
            />
            <Chip label={`${orders.length} Orders`} color="primary" size="small" />
            <Chip label={`${events.length} Events`} color="secondary" size="small" />
          </Box>
        </Paper>

        {/* Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
            <Tab icon={<ShoppingCart />} label="Orders" />
            <Tab icon={<Timeline />} label="Event Timeline" />
            <Tab icon={<History />} label="Time Travel" />
            <Tab icon={<Speed />} label="Performance" />
            <Tab icon={<Architecture />} label="Architecture" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Actions */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<ShoppingCart />}
                    onClick={() => setPlaceOrderDialog(true)}
                    disabled={loading}
                  >
                    Place Order
                  </Button>
                  <Button variant="outlined" onClick={fetchOrders} disabled={loading}>
                    Refresh
                  </Button>
                  <Button variant="outlined" color="warning" onClick={simulateLoad} disabled={loading}>
                    Simulate Load (100 orders)
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Orders List */}
            {orders.map((order) => (
              <Grid item xs={12} md={6} lg={4} key={order.orderId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Order #{order.orderId.slice(0, 8)}</Typography>
                      <Chip
                        label={order.status}
                        color={
                          order.status === 'PLACED'
                            ? 'success'
                            : order.status === 'CANCELLED'
                            ? 'error'
                            : 'default'
                        }
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Customer: {order.customerId}
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      ${order.totalAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.items.length} items • v{order.version}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => setSelectedOrder(order)}>
                      Details
                    </Button>
                    {order.status === 'PLACED' && (
                      <Button size="small" color="error" onClick={() => cancelOrder(order.orderId)}>
                        Cancel
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Event Timeline
            </Typography>
            <List>
              {events.map((event, index) => (
                <React.Fragment key={event.eventId}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {event.eventType === 'OrderPlaced' && <CheckCircle color="success" />}
                          {event.eventType === 'OrderCancelled' && <Cancel color="error" />}
                          <Typography variant="subtitle1">{event.eventType}</Typography>
                          <Chip label={`v${event.aggregateVersion}`} size="small" />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2">
                            Aggregate: {event.aggregateId.slice(0, 12)}...
                          </Typography>
                          <Typography variant="caption">
                            {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < events.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Time Travel - Temporal Queries
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Use the slider to travel back in time and see historical state
            </Typography>
            <Box sx={{ px: 2, py: 3 }}>
              <Typography gutterBottom>
                Selected Time: {new Date(temporalTime).toLocaleString()}
              </Typography>
              <Slider
                value={temporalTime}
                onChange={(_, v) => setTemporalTime(v as number)}
                min={Date.now() - 24 * 60 * 60 * 1000}
                max={Date.now()}
                step={60000}
              />
            </Box>
            <Alert severity="info">
              Select an order and use the slider to see its state at different points in time
            </Alert>
          </Paper>
        )}

        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Command Latency
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {metrics.commandLatency}ms
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((metrics.commandLatency / 200) * 100, 100)}
                    sx={{ mt: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target: &lt; 200ms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Events
                  </Typography>
                  <Typography variant="h3" color="secondary">
                    {metrics.totalEvents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Complete audit trail
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {metrics.successRate}%
                  </Typography>
                  <LinearProgress variant="determinate" value={metrics.successRate} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 4 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Architecture Overview
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <img
                src="/architecture-diagram.svg"
                alt="Architecture"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Key Benefits
                </Typography>
                <List dense>
                  <ListItem>✅ Complete audit trail via Event Sourcing</ListItem>
                  <ListItem>✅ Optimized read models via CQRS</ListItem>
                  <ListItem>✅ Real-time updates via WebSocket</ListItem>
                  <ListItem>✅ Schema validation on all events</ListItem>
                  <ListItem>✅ Temporal queries for compliance</ListItem>
                  <ListItem>✅ Sub-second performance</ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  AWS Free Tier
                </Typography>
                <List dense>
                  <ListItem>💰 Lambda: 1M requests/month</ListItem>
                  <ListItem>💰 DynamoDB: 25GB storage</ListItem>
                  <ListItem>💰 API Gateway: 1M requests/month</ListItem>
                  <ListItem>💰 S3: 5GB storage</ListItem>
                  <ListItem>💰 Estimated cost: $0/month</ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Place Order Dialog */}
        <PlaceOrderDialog
          open={placeOrderDialog}
          onClose={() => setPlaceOrderDialog(false)}
          onSubmit={placeOrder}
        />
      </Container>
    </Box>
  );
}

// Place Order Dialog Component
function PlaceOrderDialog({ open, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    orderId: `order-${Date.now()}`,
    customerId: 'customer-demo',
    totalAmount: 99.99,
    items: [{ productId: 'product-1', quantity: 2, price: 49.99 }],
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Place New Order</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Order ID"
          value={formData.orderId}
          onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Customer ID"
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Total Amount"
          type="number"
          value={formData.totalAmount}
          onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Place Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default App;
