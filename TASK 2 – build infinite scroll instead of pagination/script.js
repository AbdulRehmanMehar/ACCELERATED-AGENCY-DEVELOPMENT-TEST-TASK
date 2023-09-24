let isFetching = false;
let _urlParams = new URLSearchParams(window.location.search);
let currentPageNumber = parseInt(_urlParams.get('page') || '1');
let hasLoadedAllProducts = false;
let currentURL = window.location.pathname;

const createParagraphElement = (text, id = null) => {
	const parag = document.createElement('p');
	const textNode = document.createTextNode(text);
	if (id) parag.id = id;
	
	parag.appendChild(textNode);
	
	return parag;
}

const createCategorySelectorComponent = () => {
  const select = document.createElement("select");
  select.name = "__product-category-selector";

  select.classList.add("__category-selector");
  
  const categories = [...document.querySelectorAll('#collection-filter-drawer .Linklist__Item a')];
  
  const options = categories.map((variant) => {
    const option = document.createElement("option");
    option.value = variant.getAttribute('href');
    
    if (window.location.href.includes(option.value)) option.selected = 'selected';

    const optionText = document.createTextNode(variant.innerText);
    option.appendChild(optionText);

    return option;
  });

  options.forEach((option) => {
    select.appendChild(option);
  });

  return select;
};

const createSortSelectorComponent = () => {
  const select = document.createElement("select");
  select.name = "__product-sort-selector";

  select.classList.add("__sort-selector");
  
  const categories = [...document.querySelectorAll('button[data-action="select-value"]')];
  
  const options = categories.map((variant) => {
    const option = document.createElement("option");
    option.value = variant.getAttribute('data-value');
    
   
    
    if (_urlParams.get('sort_by') == option.value) option.selected = 'selected';

    const optionText = document.createTextNode(variant.innerHTML);
    option.appendChild(optionText);

    return option;
  });

  options.forEach((option) => {
    select.appendChild(option);
  });

  return select;
};

const loadInfinteProducts = async () => {
	try {
		_urlParams.delete('page');
		_urlParams.append('page', ++currentPageNumber);
		
		const customToolbar = document.querySelector('#__custom-filter-toolbar');
		if (customToolbar) customToolbar.remove();
		addViewToDisplayFiltersAndSort();
		
		const abortController = new AbortController();
		const productsContainer = document.querySelector('.CollectionMain .CollectionInner .CollectionInner__Products .ProductList');
		
		const existingH3 = document.querySelector('.__info-message');
		if (existingH3) existingH3.remove();
		
		const loadingComponent = document.createElement('div');
		loadingComponent.classList.add('__loader-component');
		const loaderWrapper = document.createElement('div');
		loaderWrapper.classList.add('__loader-wrapper');
		
		loaderWrapper.append(loadingComponent);
		productsContainer.append(loaderWrapper);
		
		if (isFetching) {
			
			abortController.abort();
			
		}
		isFetching = true;
		const resp = await fetch(`${currentURL}?${_urlParams.toString()}`, {signal: abortController.signal});
		const data = await resp.text();
	
		loaderWrapper.remove();
	
		const tempElement = document.createElement('div');
		tempElement.innerHTML = data;
		
		const productData = tempElement.querySelector('.CollectionMain .CollectionInner .CollectionInner__Products .ProductList');
		
		if (!productData.querySelector('div')) {
			const infoMessage = document.createTextNode('All products loaded');
			const h3Element = document.createElement('h3');
			h3Element.classList.add('__info-message');
			
			h3Element.appendChild(infoMessage);
			
			document.querySelector('.CollectionMain .CollectionInner .CollectionInner__Products').appendChild(h3Element);
			hasLoadedAllProducts = true;
			return;
		}
		
		
		
		productsContainer.append(...(productData.children));
		
		const numberofDisplayedProducts = productsContainer.children.length;
	
		document.querySelector('#__number-of-displayed-products').innerHTML = `${numberofDisplayedProducts} PRODUCTS`;
		
		isFetching = false;
	} catch(error) {
		if (error.name === 'AbortError') return;
		console.log(error, 'error while fetching products');
		
	}
}

const resetFetchCriteria = (url = null) => {
	_urlParams = new URLSearchParams(window.location.search);
	
	isFetching = false;
	hasLoadedAllProducts = false;
	if (url) currentURL = url;
	currentPageNumber = 0;
	document.querySelector('.CollectionMain .CollectionInner .CollectionInner__Products .ProductList').innerHTML = '';
}

const addFilterSupport = () => {
	const modalAnchorTags = document.querySelectorAll('#collection-filter-drawer .Linklist__Item a');
	const sidebarAnchorTags = document.querySelectorAll('.collection-filters-form .Linklist .Linklist__Item a');
	const allAnchorTagsArray = [...modalAnchorTags, ...sidebarAnchorTags];
	allAnchorTagsArray.forEach(anchor => {
		anchor.addEventListener('click', async (event) => {
			event.preventDefault();
			
			const href = event.target.getAttribute('href');
			const linkText = event.target.innerText;
			
			const selectedListItems = [...document.querySelectorAll('#collection-filter-drawer .Linklist .Linklist__Item.is-selected'), ...document.querySelectorAll('.collection-filters-form .Linklist .Linklist__Item.is-selected')];
			
			selectedListItems.forEach(selectedItem => {
				selectedItem.classList.remove('is-selected');
				
				selectedItem.querySelector('a').classList.remove('is-active');
			});
			
			const linksWithCurrentHref = [...document.querySelectorAll(`a.Link[href="${href}"]`)];
			
			
			linksWithCurrentHref.forEach(link => {
				link.classList.add('is-active');
				link.parentElement.classList.add('is-selected');
			});
			
			document.querySelector('.PageHeader h1.SectionHeader__Heading').innerText = linkText;
			
			resetFetchCriteria(href);
			window.history.pushState({ href: 'update' }, linkText, href + '/?' + _urlParams.toString());
			await loadInfinteProducts();
			
		});
	});
}

const addSortSupport = () => {
	const allSortBtns = [...document.querySelectorAll('button[data-action="select-value"]')];
	
	allSortBtns.forEach(btn => {
		
		btn.addEventListener('click', async (event) => {

			event.preventDefault();
			
			
			const sortType = event.target.getAttribute('data-value');
			
			resetFetchCriteria();
			
			_urlParams.delete('sort_by');
			_urlParams.append('sort_by', sortType);
			await loadInfinteProducts();
			
		});
	});
	

}


const addViewToDisplayFiltersAndSort = (numberOfProducts = 0) => {
	const toolbar = document.querySelector('.CollectionToolbar');

	const container = document.createElement('div');
	container.classList.add('__product-filert-container');
	container.id = '__custom-filter-toolbar';
	
	const filterText = createParagraphElement('Filter:');
	const filterSelector = createCategorySelectorComponent();
	
	const filterContainer = document.createElement('div');
	filterContainer.append(filterText, filterSelector);
	
	
	const sortText = createParagraphElement('Sort:');
	const sortSelector = createSortSelectorComponent();
	const numberOfProductsText = createParagraphElement(numberOfProducts + ' PRODUCTS', '__number-of-displayed-products');
	
	const sortContainer = document.createElement('div');
	sortContainer.append(sortText, sortSelector, numberOfProductsText);
	
	
	
	container.append(filterContainer, sortContainer);
	
	toolbar.insertAdjacentElement('afterend', container);
	
	
	filterSelector.onchange = (event) => {
		const { selectedOptions } = event.target;

    	const currentOption = selectedOptions[0];
    	
    	const value = currentOption.value;
    	
    	document.querySelector(`#collection-filter-drawer .Linklist__Item a[href="${value}"]`).click();
	}
	
	sortContainer.onchange = (event) => {
		const { selectedOptions } = event.target;

    	const currentOption = selectedOptions[0];
    	
    	const value = currentOption.value;
    	
    	
    	document.querySelector(`button[data-action="select-value"][data-value="${value}"]`).click();
	}
}


document.addEventListener("DOMContentLoaded", async (event) => {

	document.querySelector('#collection-filters-sidebar-form').removeAttribute('id');
	document.querySelector('#collection-filters-drawer-form').removeAttribute('id');

	addFilterSupport();
	addSortSupport();
	
	const numberofDisplayedProducts = document.querySelectorAll('.CollectionMain .ProductList .Grid__Cell').length;
	
	addViewToDisplayFiltersAndSort(numberofDisplayedProducts);
	
	
	window.addEventListener("scroll", async () => {
	if (isFetching) return;
	if (window.innerHeight + window.scrollY >= document.querySelector('.CollectionMain').offsetHeight) {
		
			
    		if (!hasLoadedAllProducts) await loadInfinteProducts();
    		
		}
	});

});



