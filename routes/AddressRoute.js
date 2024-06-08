import express from "express";
import { 
    createAddress,
    deleteAddress, 
    getAddresByUserId, 
    getAddress, 
    getAddressByAddressId, 
    updateAddress
} from "../controllers/AddressController.js";

const route = express.Router();

route.get('/addresses', getAddress);
route.get('/addresses/:userId', getAddresByUserId);
route.get('/address/:addressId', getAddressByAddressId);
route.post('/address', createAddress);
route.patch('/address/:id', updateAddress);
route.delete('/address/:id', deleteAddress);

export default route;