import React from "react";
import { Redirect, Route, Switch } from "wouter";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { CartProvider } from "@/contexts/CartContext";
import AdminCarts from "@/pages/AdminCarts";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminImport from "@/pages/AdminImport";
import AdminLogin from "@/pages/AdminLogin";
import AdminNotifications from "@/pages/AdminNotifications";
import AdminOrders from "@/pages/AdminOrders";
import AdminProducts from "@/pages/AdminProducts";
import AdminUsers from "@/pages/AdminUsers";
import Cart from "@/pages/Cart";
import Collection from "@/pages/Collection";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import OrderConfirmation from "@/pages/OrderConfirmation";
import OrderTracking from "@/pages/OrderTracking";
import ProductDetail from "@/pages/ProductDetail";

function ProtectedAdminRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--ivory)",
          color: "var(--secondary)",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
        }}
      >
        Authenticating operations workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/admin/login" />;
  }

  return <Component />;
}

export default function App() {
  return (
    <AdminAuthProvider>
      <CartProvider>
        <Switch>
          {/* Customer Storefront Routes */}
          <Route path="/" component={Home} />
          <Route path="/collection" component={Collection} />
          <Route path="/product/:slug" component={ProductDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/order-confirmation/:orderNumber" component={OrderConfirmation} />
          <Route path="/track-order" component={OrderTracking} />

          {/* Admin Authentication */}
          <Route path="/admin/login" component={AdminLogin} />

          {/* Protected Admin Routes */}
          <Route path="/admin">
            {() => <ProtectedAdminRoute component={AdminDashboard} />}
          </Route>
          <Route path="/admin/products">
            {() => <ProtectedAdminRoute component={AdminProducts} />}
          </Route>
          <Route path="/admin/orders">
            {() => <ProtectedAdminRoute component={AdminOrders} />}
          </Route>
          <Route path="/admin/import">
            {() => <ProtectedAdminRoute component={AdminImport} />}
          </Route>
          <Route path="/admin/carts">
            {() => <ProtectedAdminRoute component={AdminCarts} />}
          </Route>
          <Route path="/admin/notifications">
            {() => <ProtectedAdminRoute component={AdminNotifications} />}
          </Route>
          <Route path="/admin/users">
            {() => <ProtectedAdminRoute component={AdminUsers} />}
          </Route>

          {/* Catch-all 404 */}
          <Route component={NotFound} />
        </Switch>
      </CartProvider>
    </AdminAuthProvider>
  );
}
