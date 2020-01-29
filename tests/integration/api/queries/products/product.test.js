import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const productQuery = importAsString("./productQuery.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const internalProductId = "999";
const opaqueProductId = "cmVhY3Rpb24vcHJvZHVjdDo5OTk="; // reaction/product:999
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const internalVariantIds = ["875", "874", "925"];

const shopName = "Test Shop";

const mockProduct = {
  _id: internalProductId,
  ancestors: [],
  title: "Fake Product",
  shopId: internalShopId,
  isDeleted: false,
  isVisible: true,
  supportedFulfillmentTypes: ["shipping"],
  type: "simple",
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockVariant = {
  _id: internalVariantIds[0],
  ancestors: [internalProductId],
  attributeLabel: "Variant",
  title: "Fake Product Variant",
  shopId: internalShopId,
  isDeleted: false,
  isVisible: true,
  type: "variant"
};

const mockOptionOne = {
  _id: internalVariantIds[1],
  ancestors: [internalProductId, internalVariantIds[0]],
  attributeLabel: "Option",
  title: "Fake Product Option One",
  shopId: internalShopId,
  isDeleted: false,
  isVisible: true,
  type: "variant"
};

const userGroup = Factory.Group.makeOne({
  _id: "customerGroup",
  createdBy: null,
  name: "customer",
  permissions: ["reaction:legacy:products/read"],
  slug: "customer",
  shopId: internalShopId
});

let testApp;
let queryProduct;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  queryProduct = testApp.query(productQuery);
  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });
  await testApp.collections.Products.insertOne(mockProduct);
  await testApp.collections.Products.insertOne(mockVariant);
  await testApp.collections.Products.insertOne(mockOptionOne);

  await testApp.collections.Groups.insertOne(userGroup);

  await testApp.setLoggedInUser({
    _id: "123",
    groups: [userGroup._id]
  });
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

test("expect a single product", async () => {
  let result;

  try {
    result = await queryProduct({
      productId: opaqueProductId,
      shopId: opaqueShopId
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.product.title).toEqual("Fake Product");
  expect(result.product.variants[0].title).toEqual("Fake Product Variant");
  expect(result.product.variants[0].options[0].title).toEqual("Fake Product Option One");
});