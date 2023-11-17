import CustomerDetails from "../models/customerDetails.js";
import PurchaseDetails from "../models/purchase.js";
import ShippingDetails from "../models/shippingDetails.js";
import { error, success } from "../Utils/response.js";

//1. Create API's through which we can add customers and their details.

export const addCustomer = async (req, res) => {
  try {
    const { customer_name, email, mobile, city } = req.body;

    if (!customer_name || !email || !mobile || !city)
      res.send(error(500, "All fields are required"));

    if (mobile.length !== 10) res.send(error(500, "Invalid Mobile Number"));

    const existing_customer = await CustomerDetails.findOne({ email });
    if (existing_customer) res.send(error(500, "Email already used!"));

    const newCustomer = await CustomerDetails.create({
      customer_name,
      email,
      mobile,
      city,
    });

    await newCustomer.save();

    res.send(success(201, { newCustomer }));
  } catch (error) {
    console.log(error);
    res.send(error(500, "Something Went Wrong"));
  }
};

//2. Create an API for Purchase Order.

export const addPurchaseDetails = async (req, res) => {
  try {
    const {
      product_name,
      pricing,
      quantity,
      mrp,
      purchase_order_id,
      customer_id,
    } = req.body;
    if (!product_name || !pricing || !quantity || !mrp || !customer_id) {
      return res.send(error(500, "All details are required"));
    }
    if (pricing >= mrp) {
      return res.send(error(401, "pricing should be less than mrp"));
    }
    const newPurchase = await PurchaseDetails.create({
      product_name,
      pricing,
      quantity,
      mrp,
      purchase_order_id,
      customer_id,
    });
    await newPurchase.save();
    res.send(success(201, { newPurchase }));
  } catch (error) {
    console.log(error);
    res.send(error(500, "Something went wrong"));
  }
};

//3. Create an API for Shipping Details.

export const addShippingDetails = async (req, res) => {
  try {
    const { address, city, pincode, purchase_order_id, customer_id } = req.body;

    const newShippment = await ShippingDetails.create({
      address,
      city,
      pincode,
      purchase_order_id,
      customer_id,
    });

    if (!address || !city || !pincode || !purchase_order_id || !customer_id) {
      return res.send(error(500, "All details are required"));
    }

    await newShippment.save();

    res.send(success(201, { newShippment }));
  } catch (error) {
    console.log(error);
    res.send(error(500, "Something Went Wrong"));
  }
};

//4. Create an API to get customers which have shipment with city filter

export const getCustomersWithCityFilter = async (req, res) => {
  try {
    const city = req.headers.city;
    console.log("city is : ", city);
    const result = await CustomerDetails.aggregate([
      {
        $match: { city: city },
      },
      {
        $lookup: {
          from: "shippingdetails",
          localField: "customer_id",
          foreignField: "customer_id",
          as: "shipmentDetails",
        },
      },
      {
        $project: {
          _id: 0,
          customer_name: 1,
          email: 1,
          mobile: 1,
          city: 1,
          customer_id: 1,
          shipmentDetails: {
            $map: {
              input: "$shipmentDetails",
              as: "shipment",
              in: {
                address: "$$shipment.address",
                city: "$$shipment.city",
                pincode: "$$shipment.pincode",
                purchase_id: "$$shipment.purchase_order_id",
              },
            },
          },
        },
      },
    ]);

    res.send(success(201, result));
  } catch (error) {
    console.log(error);
    res.send(error(500, "Something went wrong"));
  }
};

//5. Create an API to get customers with all purchase order

export const customer_all_purchaseOrder = async (req, res) => {
  try {
    const response = await CustomerDetails.aggregate([
      {
        $lookup: {
          from: "purchases",
          localField: "customer_id",
          foreignField: "customer_id",
          as: "purchaseOrders",
        },
      },
      {
        $project: {
          _id: 0,
          customer_id: 1,
          customer_name: 1,
          email: 1,
          mobile: 1,
          city: 1,
          purchaseOrders: {
            $map: {
              input: "$purchaseOrders",
              as: "order",
              in: {
                purchaseOrderId: "$$order.purchase_order_id",
                productName: "$$order.product_name",
                pricing: "$$order.pricing",
                quantity: "$$order.quantity",
                mrp: "$$order.mrp",
              },
            },
          },
        },
      },
    ]);
    res.send(success(201, response));
  } catch (error) {
    console.log(error);
    res.send(error(500, "something went wrong"));
  }
};

//6. Create an API to get customer with all purchase order and shipment details

export const getCustomerWithOrdersAndShipments = async (req, res) => {
  try {
    const response = await CustomerDetails.aggregate([
      {
        $lookup: {
          from: "purchases",
          localField: "customer_id",
          foreignField: "customer_id",
          as: "purchaseOrders",
        },
      },
      {
        $unwind: "$purchaseOrders",
      },
      {
        $lookup: {
          from: "shippingdetails",
          localField: "purchaseOrders.purchase_order_id",
          foreignField: "purchase_order_id",
          as: "shipmentDetails",
        },
      },
      {
        $group: {
          _id: {
            customer_id: "$customer_id",
            customer_name: "$customer_name",
            email: "$email",
            mobile: "$mobile",
            city: "$city",
          },
          purchaseOrders: {
            $push: {
              purchaseOrderId: "$purchaseOrders.purchase_order_id",
              productName: "$purchaseOrders.product_name",
              quantity: "$purchaseOrders.quantity",
              shipmentDetails: "$shipmentDetails",
            },
          },
        },
      },
      {
        $project: {
          customerId: 1,
          customerName: 1,
          email: 1,
          mobile: 1,
          city: 1,
          purchaseOrders: 1,
        },
      },
    ]);

    res.send(success(201, response));
  } catch (error) {
    console.log(error);
    res.send(error(500, "Something went wrong"));
  }
};
