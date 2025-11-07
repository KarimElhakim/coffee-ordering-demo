import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrders, markOrderPaid } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@coffee-demo/ui';
import { CreditCard, CheckCircle, X } from 'lucide-react';

export function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      const orders = await getOrders();
      const found = orders.find((o: any) => o.id === orderId);
      if (found) {
        setOrder(found);
      }
    }
    loadOrder();
  }, [orderId]);

  const handlePayment = async () => {
    if (!order || !cardNumber || !expiry || !cvc || !name) {
      alert('Please fill in all payment details');
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Mark order as paid (works in demo mode)
      await markOrderPaid(order.id, 'card_present_demo', order.total_amount);
      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/order/${order.id}?success=true`);
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Button onClick={() => navigate('/')}>Back to Menu</Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Your order has been received and is being prepared.
              </p>
              <Button onClick={() => navigate(`/order/${order.id}?success=true`)}>
                View Order Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-4">
              <span className="text-sm text-muted-foreground">Order Total</span>
              <span className="text-2xl font-bold">{order.total_amount.toFixed(2)} EGP</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  if (value.length <= 16 && /^\d*$/.test(value)) {
                    setCardNumber(value.replace(/(.{4})/g, '$1 ').trim());
                  }
                }}
                maxLength={19}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Demo: Use any card number (e.g., 4242 4242 4242 4242)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                <Input
                  id="expiry"
                  placeholder="12/25"
                  value={expiry}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 4) {
                      setExpiry(value.replace(/(.{2})/, '$1/'));
                    }
                  }}
                  maxLength={5}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 3) {
                      setCvc(value);
                    }
                  }}
                  maxLength={3}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">Cardholder Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={processing || !cardNumber || !expiry || !cvc || !name}
            >
              {processing ? 'Processing...' : `Pay ${order.total_amount.toFixed(2)} EGP`}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              This is a demo payment system. No real charges will be made.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

