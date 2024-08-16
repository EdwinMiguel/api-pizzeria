class ProductsService {
  constructor () {
    this.products = [];
  }

  async getProducts () {
    return this.products;
  }

  async save (product) {
    const newProduct = {
      id: await this.createId(),
      name: product.name,
      price: product.price,
      stock: product.stock
    };

    this.products.push(newProduct);
    return this.products;
  }

  async update (id, changes) {
    const index = this.products.findIndex(item => item.id === Number(id));

    if (index === -1) {
      throw new Error('Product not found');
    };

    const product = this.products[index];
    this.products[index] = {
      ...product,
      ...changes
    };

    return this.products[index];
  }

  async delete(id) {
    const index = this.products.findIndex(item => item.id === id);

    if (index === -1) {
      console.log('product not found')
    }

    this.products.splice(index, 1);

    return { id };
  }

  async createId() {
    const id = this.products.length + 1;
    return id;
  }

}

module.exports = ProductsService;
