import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import CustomerList from "@/pages/CustomerList";
import CustomerDetail from "@/pages/CustomerDetail";
import OrderList from "@/pages/OrderList";
import OrderDetail from "@/pages/OrderDetail";
import Inventory from "@/pages/Inventory";
import Followups from "@/pages/Followups";
import { useAppStore } from "@/store";

function InitData() {
  const initData = useAppStore(s => s.initData);
  useEffect(() => {
    initData();
  }, [initData]);
  return null;
}

export default function App() {
  return (
    <Router>
      <InitData />
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/followups" element={<Followups />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
