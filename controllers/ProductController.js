import prisma from "../lib/prisma.js";
import fs from "fs";
import multer from "multer";


// Get Data Products
export const getDataProducts =  async (req, res) => {
    try {
        const dataProducts = await prisma.products.findMany({
          orderBy: {
            id: "desc"
          }
        });
        res.status(200).json({
            data: dataProducts
        });
    } catch (error) {
        console.log(error);
    }
}

//Get Single Data
export const getSingleProduct = async (req, res) => {
    const { slug } = req.params;
    try {
        const product = await prisma.products.findFirst({
            where: {
                slug: slug
            }
        });
        if(!product) return res.status(404).json({message: "No data found"});

        res.status(200).json({ data: product });
    } catch (error) {
        console.log(error);
    }
}


// Create Product
  export const createProduct = async (req, res) => {
    try {
        const { title, price, description, category } = req.body;
        const colors = req.body.colors.split(",");
        const sizes = req.body.sizes.split(",");
        const slug = title.toLowerCase().replace(/\s+/g, '-');

        if (!req.files.length) {
          return res.status(400).json({ message: "No images uploaded" });
        }

        const images = req.files.map((file) => file.filename);
    
        const createdProduct = await prisma.products.create({
          data: {
            title,
            slug,
            price: parseInt(price),
            description,
            category,
            colors,
            sizes,
            images,
            images_url: images.map((image) => `${req.protocol}://${req.get("host")}/images/${image}`),
          },
        });
    
        res.status(201).json({
          message: "Product Created", 
          data: createdProduct
        });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    };


// Update Product
export const updateProduct = async (req, res) => {
    const { id } = req.params;

    const product = await prisma.products.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    if(!product) return res.status(404).json({message: "No data found"})

    let fileName = [];
    if(req.files && req.files.length > 0) {
      product.images.forEach(image => {
        fs.unlinkSync(`./public/images/${image}`);
      });

      fileName = req.files.map(file => file.filename);
    } else {
      fileName = product.images;
    }

    const { title, price, description, category } = req.body;
    const colors = req.body.colors.split(",");
    const sizes = req.body.sizes.split(",");
    const url = fileName.map((image) => `${req.protocol}://${req.get("host")}/images/${image}`)

    try {
      const result = await prisma.products.update({
        where: { 
          id: parseInt(id)
        },
        data: {
          title,
          price: parseInt(price),
          description,
          category,
          colors,
          sizes,
          images: fileName,
          images_url: url,
        }
      })

      res.status(200).json({message: "Product Updated Successfully", data: result})
    } catch (error) {
      console.error(error);
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
}


// Delete Product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  const product = await prisma.products.findUnique({
    where: {
      id: parseInt(id)
    }
  });
  if(!product) return res.status(404).json({message: "No data found"})

  try { 
    product.images.forEach(image => {
      fs.unlink(`./public/images/${image}`, (err) => {
        if (err) {
          console.log(err);
        }
      }); 
    });
    await prisma.products.delete({
      where: {
        id: parseInt(id)
      }
    });
    return res.status(200).json({message: "Product Deleted Successfully"});
  } catch (error) {
    console.log(error);
  }
}