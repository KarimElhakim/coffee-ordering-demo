import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Label, Input } from '@coffee-demo/ui';
import { User, Phone, Mail } from 'lucide-react';

interface CustomerDetails {
  phone: string;
  email?: string;
  name?: string;
}

interface CustomerDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: CustomerDetails) => void;
  paymentMethod: 'cash' | 'card_present_demo';
  total: number;
}

export function CustomerDetailsModal({ 
  open, 
  onClose, 
  onSubmit, 
  paymentMethod,
  total 
}: CustomerDetailsModalProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ phone?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number (required)
    if (!phone || phone.trim() === '') {
      setErrors({ phone: 'Phone number is required' });
      return;
    }

    // Basic phone validation (numbers only, at least 10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setErrors({ phone: 'Please enter a valid phone number (at least 10 digits)' });
      return;
    }

    // Email validation (if provided)
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrors({ phone: undefined }); // Clear phone error
        return; // Email validation can be added later if needed
      }
    }

    // Submit with collected details
    onSubmit({
      phone: phoneDigits, // Store only digits
      email: email.trim() || undefined,
      name: name.trim() || undefined,
    });
  };

  const handlePhoneChange = (value: string) => {
    // Allow only digits, spaces, dashes, and plus sign
    const cleaned = value.replace(/[^\d\s\-\+]/g, '');
    setPhone(cleaned);
    if (errors.phone) {
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent 
        className="!max-w-md !w-[90vw] !max-h-[95vh] overflow-y-auto !bg-white !dark:!bg-gray-900 !border-2 !border-gray-300 !dark:!border-gray-600 !rounded-xl !p-8"
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          zIndex: 1000,
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <DialogHeader className="!text-center mb-6 flex flex-col items-center w-full">
          <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2 !text-center w-full">
            Customer Details
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400 mb-4 !text-center w-full">
            Please enter customer information to complete the order
          </DialogDescription>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Amount</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {total.toFixed(2)} EGP
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">Payment Method</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {paymentMethod === 'cash' ? 'Cash' : 'Card'}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-2 w-full">
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
          {/* Phone Number - Required */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-900 dark:text-white flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+20 123 456 7890"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`border-2 rounded-xl focus:border-gray-900 dark:focus:border-white ${
                errors.phone 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-700'
              }`}
              required
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Email - Optional */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              Email <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-gray-900 dark:focus:border-white"
            />
          </div>

          {/* Name - Optional */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              Customer Name <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-gray-900 dark:focus:border-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:border-gray-400 dark:hover:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Continue
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

