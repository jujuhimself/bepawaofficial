# Pharmacy Management Platform

A comprehensive platform for managing pharmacy operations, including inventory, orders, credit accounts, and more.

## Features

- **Order Management**
  - Create and track orders
  - Multiple status tracking (order status, payment status, delivery status)
  - Order history and filtering

- **Inventory Management**
  - Track stock levels
  - Automatic reorder alerts
  - Stock location tracking
  - Transaction history

- **Credit Management**
  - Set credit limits
  - Track credit balances
  - Payment processing
  - Transaction history

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pharm-flow-connect-78
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Database Setup**
   Run the database migrations:
   ```bash
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Project Structure

- `/src`
  - `/components` - React components
  - `/services` - Business logic and API calls
  - `/hooks` - Custom React hooks
  - `/pages` - Next.js pages
  - `/utils` - Utility functions
  - `/contexts` - React contexts
  - `/types` - TypeScript type definitions

- `/supabase`
  - `/migrations` - Database migrations

## Database Schema

### Orders
- `orders` - Main orders table
  - Status tracking (order status, payment status, delivery status)
  - Status history
  - Timestamps

### Inventory
- `inventory` - Product inventory
  - Stock levels
  - Reorder points
  - Location tracking
- `inventory_transactions` - Stock movement history

### Credit Management
- `credit_limits` - Customer credit accounts
  - Credit limits
  - Current balances
  - Status tracking
- `credit_transactions` - Credit transaction history

## Development

### Running Migrations
```bash
npm run migrate
```

### Code Style
The project uses ESLint and Prettier for code formatting. Run the following commands:
```bash
npm run lint
npm run format
```

### Testing
```bash
npm run test
```

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Run database migrations**
   ```bash
   npm run migrate
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 