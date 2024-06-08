import prisma from "../lib/prisma.js";
import fs from "fs";
import multer from "multer";
import jwt from "jsonwebtoken";

export const getDataProducts =  async (req, res) => {
    const { search, category, type, minPrice, maxPrice, sortPrice, colors, sizes, style, page, limit } = req.query;
    const colorFilter = colors?.split(',');
    const sizeFilter = sizes?.split(',');
    const total = await prisma.products.count();
    const pageCount = Math.ceil(total / parseInt(limit));

    try {
      if(colorFilter?.length) {
        const dataProducts = await prisma.products.findMany({
          orderBy: [
            { price: sortPrice === "asc" ? "asc" : sortPrice === "desc" ? "desc" : undefined },
            { id: "desc" }
          ],
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                profile_picture_url: true,
                slug: true
              }
            }
          },
          where: {
            AND: [{
            title: {
              contains: search,
              mode: "insensitive"
            },
            category: {
              contains: category,
              mode: "insensitive"
            },
            type: {
              equals: type || undefined,
              mode: "insensitive"
            },
            style: {
              equals: style || undefined,
              mode: "insensitive"
            },
            colors: {
              hasSome: colorFilter || [],
            },
            sizes: {
              hasSome: sizeFilter || [],
            },
            price: {
              gte: parseInt(minPrice) || undefined,
              lte: parseInt(maxPrice) || undefined,
            }
          }]
          },
          skip: (page - 1) * parseInt(limit),
          take: parseInt(limit),
        });
        res.status(200).json({
            data: dataProducts,
            total,
            pageCount,
            currentPage: parseInt(page),
            nextPage: pageCount > parseInt(page) ? `${process.env.BACKEND_URL}/products?page=${parseInt(page) + 1}&limit=${limit}` : null,
            prevPage: parseInt(page) > 1 ? `${process.env.BACKEND_URL}/products?page=${parseInt(page) - 1}&limit=${limit}` : null,
        });
      } else {
        const dataProducts = await prisma.products.findMany({
          orderBy: [
            { price: sortPrice === "asc" ? "asc" : sortPrice === "desc" ? "desc" : undefined },
            { id: "desc" }
          ],
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                profile_picture_url: true,
                slug: true
              }
            }
          },
          where: {
            AND: [{
            title: {
              contains: search,
              mode: "insensitive"
            },
            category: {
              contains: category,
              mode: "insensitive"
            },
            type: {
              equals: type || undefined,
              mode: "insensitive"
            },
            style: {
              equals: style || undefined,
              mode: "insensitive"
            },
            price: {
              gte: parseInt(minPrice) || undefined,
              lte: parseInt(maxPrice) || undefined,
            }
          }]
          },
          skip: (page - 1) * parseInt(limit),
          take: parseInt(limit),
        });
        res.status(200).json({
          data: dataProducts,
          total,
          pageCount,
          currentPage: parseInt(page),
          nextPage: pageCount > parseInt(page) ? `${process.env.BACKEND_URL}/products?page=${parseInt(page) + 1}&limit=${limit}` : null,
          prevPage: parseInt(page) > 1 ? `${process.env.BACKEND_URL}/products?page=${parseInt(page) - 1}&limit=${limit}` : null,
      });
      }
    } catch (error) {
        console.log(error);
    }
}

export const getDataProductsByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const products = await prisma.products.findMany({
      where: {
        userId: parseInt(userId)
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

    res.status(200).json({ data: products });
  } catch (error) {
    console.log(error);
  }
}

export const getDataDashboardProductsByUserId = async (req, res) => {
  const { userId } = req.params;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Forbidden" });

  let products;
  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if(err) return res.status(401).json({ message: err });
      if(decoded.role === "USER" || decoded.role === "BRAND") {
        products = await prisma.products.findMany({
          where: {
              userId: parseInt(userId)
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
      if(!products) return res.status(404).json({message: "No data found by that userId"});

    } else if(decoded.role === "ADMIN") {
      products = await prisma.products.findMany();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
    
    res.status(200).json({ data: products });
  });
  } catch (error) {
      console.log(error);
  }    
}

export const getSingleProduct = async (req, res) => {
    const { slug } = req.params;
    try {
        const product = await prisma.products.findUnique({
            where: {
                slug
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  slug: true,
                  email: true,
                  profile_picture_url: true,
                }
              }
            }
        });
        if(!product) return res.status(404).json({message: "No data found"});

        res.status(200).json({ data: product });
    } catch (error) {
        console.log(error);
    }
}

export const getTopSelling = async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      orderBy: {
        productSold: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profile_picture_url: true,
            slug: true
          }
        }
      },
    });

    return res.status(200).json({ data: products});
  } catch (error) {
    console.log(error);
  }
}

export const createProduct = async (req, res) => {
  try {
      const { title, price, description, category, type, style, productStock, userId } = req.body;
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
          type,
          style,
          colors,
          sizes,
          productStock: parseInt(productStock),
          images,
          images_url: images.map((image) => `${process.env.BACKEND_URL}/images/${image}`),
          userId: parseInt(userId)
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


export const updateProduct = async (req, res) => {
    const { slug } = req.params;

    const product = await prisma.products.findUnique({
      where: {
        slug
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

    const { title, price, description, category, type, style, productStock, userId } = req.body;
    const colors = req.body.colors.split(",");
    const sizes = req.body.sizes.split(",");
    const url = fileName.map((image) => `${process.env.BACKEND_URL}/images/${image}`)
    const slugProduct = title.toLowerCase().replace(/\s+/g, '-');

    try {
      const result = await prisma.products.update({
        where: { 
          slug
        },
        data: {
          title,
          slug: slugProduct,
          price: parseInt(price),
          description,
          category,
          type,
          style,
          colors,
          sizes,
          productStock: parseInt(productStock),
          images: fileName,
          images_url: url,
          userId: parseInt(userId)
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