import prisma from "../lib/prisma.js";
import crypto from "crypto";
import Mailgun from "mailgun.js";
import Mailgen from "mailgen";
import FormData from "form-data";

export const getOrders = async (req, res) => {
    try {
        const orders = await prisma.orders.findMany({
            include: {
                user: {
                    select: {
                    id: true,
                    username: true,
                    email: true
                  }
                }
            }
        });
        return res.status(200).json({ data: orders });
    } catch (error) {
        console.log(error);
    }
}

export const getOrdersByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const orders = await prisma.orders.findMany({
            where: {
                userId: parseInt(userId),
            },
            include: {
                user: {
                    select: {
                    id: true,
                    username: true,
                    email: true
                  }
                }
            }
        });

        return res.status(200).json({ data: orders});
    } catch (error) {
        console.log(error);
    }
}

export const getOrdersByBrandId = async (req, res) => {
    const { brandId } = req.params;

    try {
        const orders = await prisma.orders.findMany();
        const filteredOrders = orders.filter(order => order.orderItems.some(orderItem => orderItem.user.id === parseInt(brandId)));

        return res.status(200).json({ data: filteredOrders});
    } catch (error) {
        console.log(error);
    }
}

export const createOrder = async (req, res) => {
    function createInvoiceId() {
        const prefix = 'INV/';
        const year = new Date().getFullYear();

        function createRandomId() {
            return crypto.randomBytes(5).toString('hex').toUpperCase();
        }

        return prefix + year + '/' + createRandomId();
    }

    const invID = createInvoiceId();

    try {
        const { customerInfo, orderItems, subTotal, totalPrice, userId } = req.body;
        const createdOrder = await prisma.orders.create({
            data: {
                invoiceId: invID,
                customerInfo,
                orderItems: {
                    set: orderItems
                },
                totalPrice,
                userId
            }
        });

        orderItems?.map(async (item) => {
            await prisma.products.update({
                where: {
                    id: parseInt(item.id)
                },
                data: {
                    productStock: {
                        decrement: parseInt(item.productQty)
                    },
                    productSold: {
                        increment: parseInt(item.productQty)
                    }
                }
            })
        });

        const mailgun = new Mailgun(FormData);
        const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});

        const mailGenerator = new Mailgen({
            theme: 'default',
            product: {
              name: "ROW.CO",
              link: process.env.FRONTEND_URL,
              copyright: `Copyright © ${new Date().getFullYear()} ROW.CO. All rights reserved.`,
            },
        });

        const emailBody = {
            body: {
              signature: "Thank you",
              greeting: `Hi ${customerInfo?.name}`,
              intro: `We're thrilled to confirm your recent order ${invID} from ROW.CO!`,
              table: {
                data: orderItems.map((item) => ({
                  item: item.title,
                  description: `${item.productQty} x Rp.${item.price.toLocaleString()}`,
                })),
              },
              outro: [`Subtotal: Rp.${subTotal.toLocaleString()}`, `Total: Rp.${totalPrice.toLocaleString()}`, "Thanks again for your order! We appreciate your business."],
            },
        };

        mg.messages.create('sandbox886f1096c04d4beab51832400feb8464.mailgun.org', {
            from: 'ROW.CO <no-reply@sandbox886f1096c04d4beab51832400feb8464.mailgun.org>',
            to: customerInfo?.email,
            subject: "Order Success",
            text: mailGenerator.generatePlaintext(emailBody),
            html: mailGenerator.generate(emailBody)
        })
        .then(msg => console.log(msg))
        .catch(err => console.error(err));

        res.status(201).json({
            message: "Order Created", 
            data: createdOrder
        });
    } catch (error) {
        console.log(error);
    }
}

export const deleteOrder = async (req, res) => {
    const { id } = req.params;

    const order = await prisma.orders.findUnique({
        where: {
            id: parseInt(id)
        }
    });
    if(!order) return res.status(404).json({message: "No data found"})

    try {
        await prisma.orders.delete({
            where: {
                id: parseInt(id)
            }
        })
        return res.status(200).json({message: "Order Deleted Successfully"});
    } catch (error) {
        console.log(error);
    }
}

export const changeOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const order = await prisma.orders.findUnique({
            where: {
                id: parseInt(orderId)
            }
        });

        if(!order) return res.status(404).json({message: "No data found"});

        const updatedOrder = await prisma.orders.update({
            where: {
                id: parseInt(orderId)
            },
            data: {
                status
            }
        });

        return res.status(200).json({message: "Order Status Updated", data: updatedOrder});
    } catch (error) {
        console.log(error);
    }
}