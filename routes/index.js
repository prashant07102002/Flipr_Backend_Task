import express from "express";
import {
  addCustomer,
  addPurchaseDetails,
  addShippingDetails,
  getCustomerWithOrdersAndShipments,
  getCustomersWithCityFilter,
  customer_all_purchaseOrder,
} from "../controllers/index.js";

const Router = express.Router();

Router.post("/addCustomer", addCustomer);
Router.post("/addShippingDetails", addShippingDetails);
Router.post("/addPurchaseDetails", addPurchaseDetails);
Router.get("/getCustomersWithCityFilter", getCustomersWithCityFilter);
Router.get(
  "/getCustomerWithOrdersAndShipments",
  getCustomerWithOrdersAndShipments
);
Router.get("/customer_all_purchaseOrder", customer_all_purchaseOrder);

export default Router;
