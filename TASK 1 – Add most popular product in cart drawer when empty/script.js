const BASE_URL = window.Shopify.routes.root;

const grabMostPopularProduct = async () => {
  try {
    const resp = await fetch(`${BASE_URL}products/john.js`);
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error(error, "error while fetching product");
    return null;
  }
};

const refreshCart = async () => {
  try {
    const resp = await fetch(
      `${BASE_URL}cart?section_id=mini-cart&timestamp=${Date.now()}`
    );
    const data = await resp.text();

    console.log(data);

    const existingCart = document.querySelector("#sidebar-cart");
    if (!existingCart) return;

    var tempElement = document.createElement("div");
    tempElement.innerHTML = data;
    existingCart.innerHTML =
      tempElement.querySelector(".shopify-section").firstElementChild.innerHTML;

    await renderProductComponent();
  } catch (error) {
    console.error(error, "error while refreshing cart");
  }
};

const addProductToCart = async (id, quantity) => {
  try {
    const resp = await fetch(`${BASE_URL}cart/add.js`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id,
            quantity,
          },
        ],
      }),
    });

    const data = await resp.json();

    return data;
  } catch (error) {
    console.error(error, "error while adding product to cart");
    return null;
  }
};

const getCurrencyCode = () => {
  const selectedCurrencyString = document.querySelector(
    "button.SelectButton"
  ).innerText;

  const [, secondPart] = selectedCurrencyString.split("(");
  const [currencyCode] = secondPart.split(" ");

  return currencyCode;
};

const formatPrice = (price) => {
  const region = document.querySelector('input[name="country_code"]').value;
  return new Intl.NumberFormat(`en-${region}`, {
    style: "currency",
    currency: getCurrencyCode(),
  }).format(price);
};

const createContainerComponent = () => {
  const container = document.createElement("div");
  container.classList.add("__container");

  return container;
};

const createProductImageComponent = (imagePath, alt = "") => {
  const productImage = document.createElement("img");
  productImage.src = imagePath;
  productImage.alt = alt;

  productImage.classList.add("__product-image");

  return productImage;
};

const createProductInformationWrapperComponent = () => {
  const productInfoContainer = document.createElement("div");
  productInfoContainer.classList.add("__product-info");

  return productInfoContainer;
};

const createProductHeadlineComponent = (title) => {
  const productTitleText = document.createTextNode(title);
  const productTitle = document.createElement("h2");

  productTitle.appendChild(productTitleText);

  return productTitle;
};

const createProductPriceComponent = (price) => {
  const productPriceText = document.createTextNode(formatPrice(price));
  const productPrice = document.createElement("p");

  productPrice.appendChild(productPriceText);

  return productPrice;
};

const createProductVariantsSelectorComponent = (variants) => {
  const select = document.createElement("select");
  select.name = "__product-variant-selector";

  select.classList.add("__variant-selector");
  const options = variants.map((variant) => {
    const option = document.createElement("option");
    option.value = variant.id;
    option.setAttribute("data-variant-image", variant.featured_image.src);
    option.setAttribute("data-variant-name", variant.title);
    option.setAttribute("data-variant-price", variant.price);

    const optionText = document.createTextNode(variant.title);
    option.appendChild(optionText);

    return option;
  });

  options.forEach((option) => {
    select.appendChild(option);
  });

  return select;
};

const createQuantityInputComponent = () => {
  const inputElement = document.createElement("input");
  inputElement.type = "number";
  inputElement.value = "1";
  inputElement.min = "1";
  inputElement.max = "99";
  inputElement.name = "__cart-quantity";
  inputElement.oninput = 'validity.valid||(value="1");';

  return inputElement;
};

const createQuantityButton = (innerText, onClick) => {
  const btnElement = document.createElement("button");
  btnElement.onclick = onClick;

  const textElement = document.createTextNode(innerText);
  btnElement.appendChild(textElement);

  return btnElement;
};

const createQuantityContainerComponent = () => {
  const containerElement = document.createElement("div");
  containerElement.classList.add("__quantity-container");

  return containerElement;
};

const createQuantitySelectorComponent = () => {
  const quantityContainer = createQuantityContainerComponent();
  const quantityInput = createQuantityInputComponent();
  const plusBtn = createQuantityButton("+", () => {
    quantityInput.stepUp();
  });
  const minusButton = createQuantityButton("-", () => {
    quantityInput.stepDown();
  });

  quantityContainer.appendChild(minusButton);
  quantityContainer.appendChild(quantityInput);
  quantityContainer.appendChild(plusBtn);

  return quantityContainer;
};

const createAddToCartButton = (onClick) => {
  const btnElement = document.createElement("button");
  btnElement.classList.add("__add-to-cart");
  btnElement.onclick = onClick;

  const btnText = document.createTextNode("Add to cart");
  btnElement.appendChild(btnText);

  return btnElement;
};

const createCTAContainer = () => {
  const containerElement = document.createElement("div");
  containerElement.classList.add("__cta-container");

  return containerElement;
};

const createProductComponent = (product) => {
  const { featured_image, title, price, variants, id, url } = product;

  let currentSelectedVariant = variants[0].id;

  const container = createContainerComponent();
  const productInfoContainer = createProductInformationWrapperComponent();

  let productImage = createProductImageComponent(featured_image, title);

  let productTitle = createProductHeadlineComponent(title);
  let productPrice = createProductPriceComponent(price);

  const variantSelector = createProductVariantsSelectorComponent(variants);

  const ctaContainer = createCTAContainer();
  const quantityInput = createQuantitySelectorComponent();
  const addToCartBtn = createAddToCartButton();

  ctaContainer.appendChild(addToCartBtn);
  ctaContainer.appendChild(quantityInput);

  productInfoContainer.appendChild(productTitle);
  productInfoContainer.appendChild(productPrice);
  productInfoContainer.appendChild(variantSelector);
  productInfoContainer.appendChild(ctaContainer);

  container.appendChild(productImage);
  container.appendChild(productInfoContainer);

  [productImage, productTitle].forEach((el) => {
    el.onclick = () => (window.location.href = window.location.origin + url);
  });

  addToCartBtn.onclick = async () => {
    const quantityToBeAdded = document.querySelector(
      'input[name="__cart-quantity"]'
    ).value;

    const resp = await addProductToCart(
      currentSelectedVariant,
      parseInt(quantityToBeAdded)
    );

    if (!resp) {
      alert("Something went wrong while adding product to cart");
      return;
    }

    await refreshCart();
  };

  variantSelector.onchange = (event) => {
    const { selectedOptions } = event.target;

    const currentOption = selectedOptions[0];

    const featured_image = currentOption.getAttribute("data-variant-image");
    const newTitle = `${title} (${currentOption.getAttribute(
      "data-variant-name"
    )})`;
    const price = currentOption.getAttribute("data-variant-price");

    const productImageNew = createProductImageComponent(featured_image, title);

    const selectedVariant = currentOption.getAttribute("value");

    currentSelectedVariant = selectedVariant;

    const productTitleNew = createProductHeadlineComponent(newTitle);
    const productPriceNew = createProductPriceComponent(price);

    container.replaceChild(productImageNew, productImage);
    productInfoContainer.replaceChild(productTitleNew, productTitle);
    productInfoContainer.replaceChild(productPriceNew, productPrice);

    [productImageNew, productTitleNew].forEach((el) => {
      el.onclick = () => (window.location.href = window.location.origin + url);
    });

    productImage = productImageNew;
    productTitle = productTitleNew;
    productPrice = productPriceNew;
  };

  return container;
};

const renderProductComponent = async () => {
  const product = await grabMostPopularProduct();

  const cartHeader = document.querySelector("#sidebar-cart .Drawer__Header");

  const existingProductContainer = document.querySelector(
    "#sidebar-cart .__container"
  );

  if (existingProductContainer) existingProductContainer.remove();

  const productComponent = createProductComponent(product);
  cartHeader.insertAdjacentElement("afterend", productComponent);
};

document.addEventListener("DOMContentLoaded", async (event) => {
  await renderProductComponent();
});
