import prisma from "../lib/prisma.js";

export const getAddresByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const address = await prisma.address.findMany({
            where: {
                userId: parseInt(userId)
            }
        });

        res.status(200).json({ data: address });
    } catch (error) {
        console.log(error);
    }
}


export const getAddressByAddressId = async (req, res) => {
    const { addressId } = req.params;
    try {
        const address = await prisma.address.findUnique({
            where: {
                id: parseInt(addressId)
            }
        });

        res.status(200).json({ data: address });
    } catch (error) {
        console.log(error);
    }
}

export const getAddress = async (req, res) => {
    try {
        const address = await prisma.address.findMany();

        res.status(200).json({ data: address });
    } catch (error) {
        console.log(error);
    }
}

export const createAddress = async (req, res) => {
    try {
        const { name, mobileNumber, email, country, city, zip, address, userId } = req.body;

        if(!userId) return res.status(401).json({ message: "Please login first !!!" });

        const createdAddress = await prisma.address.create({
            data: {
                name,
                mobileNumber: parseInt(mobileNumber),
                email,
                country,
                city,
                zip: parseInt(zip),
                address,
                userId: parseInt(userId)
            }
        });

        res.status(201).json({ 
            message: "Address created successfully", 
            data: createdAddress 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, mobileNumber, email, country, city, zip, address, userId } = req.body;

        if(!userId) return res.status(401).json({ message: "Please login first" });

        const updatedAddress = await prisma.address.update({
            where: {
                id: parseInt(id)
            },
            data: {
                name,
                mobileNumber: parseInt(mobileNumber),
                email,
                country,
                city,
                zip: parseInt(zip),
                address,
                userId: parseInt(userId)
            }
        });

        res.status(201).json({ 
            message: "Address updated successfully", 
            data: updatedAddress 
        });
    } catch (error) {
        console.log(error);
    }
}

export const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.address.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
        console.log(error);
    }
}