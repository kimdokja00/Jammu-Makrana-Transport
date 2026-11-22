import mongoose from 'mongoose';

const stoneItemSchema = new mongoose.Schema(
  {
    stoneName: { type: String, required: true, trim: true, maxlength: 120 },
    slabSize: { type: String, trim: true, maxlength: 120, default: '' },
    slabCount: { type: String, trim: true, maxlength: 80, default: '' },
    quantityTonnes: { type: String, trim: true, maxlength: 80, default: '' },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    changedByName: { type: String, default: 'Admin' },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    // Link order to registered customer (optional for guest orders)
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    companyName: { type: String, trim: true, maxlength: 120, default: '' },

    // Delivery destination (primary routing)
    dropCity: { type: String, required: true, trim: true, maxlength: 100 },
    dropState: { type: String, required: true, trim: true, maxlength: 100 },
    dropAddress: { type: String, required: true, trim: true, maxlength: 300 },
    dropPin: { type: String, trim: true, maxlength: 10, default: '' },

    // Optional pickup info
    pickupCity: { type: String, trim: true, maxlength: 100, default: 'Makrana' },
    pickupAddress: { type: String, trim: true, maxlength: 300, default: '' },
    pickupPin: { type: String, trim: true, maxlength: 10, default: '' },

    // Cargo details: multiple stones with slab size, slab count, tonnes
    stones: { type: [stoneItemSchema], default: [] },

    // Summary strings for quick reference & backwards compatibility
    materialType: { type: String, trim: true, maxlength: 500, default: '' },
    quantity: { type: String, trim: true, maxlength: 500, default: '' },
    weightTonnes: { type: String, trim: true, maxlength: 100, default: '' },

    // Target arrival date
    arrivedByDate: { type: String, required: true, trim: true },
    pickupDate: { type: String, trim: true, default: '' }, // legacy alias

    // Optional vehicle preference
    vehicleType: { type: String, trim: true, maxlength: 100, default: '' },
    specialInstructions: { type: String, trim: true, maxlength: 2000, default: '' },

    // Enhanced status progression: placed -> confirmed -> dispatched -> shipped -> in_transit -> delivered -> rejected -> cancelled
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'dispatched', 'shipped', 'in_transit', 'delivered', 'rejected', 'cancelled'],
      default: 'placed',
      index: true,
    },

    // Dispatch & tracking info managed by Admin
    dispatchDate: { type: Date, default: null },
    dispatchLocation: { type: String, trim: true, maxlength: 300, default: '' },
    shippedDate: { type: Date, default: null },
    deliveredDate: { type: Date, default: null },
    estimatedDeliveryDate: { type: Date, default: null },

    // Payment details managed by Admin
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, trim: true, maxlength: 100, default: '' },
    paymentDate: { type: Date, default: null },
    paymentNotes: { type: String, trim: true, maxlength: 500, default: '' },

    // Full status transition history log
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
