const axios = require('axios');
const crypto = require('crypto');

class eBayService {
  constructor(DI) {
    this.DI = DI;
    this.config = {
      appId: process.env.EBAY_APP_ID,
      certId: process.env.EBAY_CERT_ID,
      clientSecret: process.env.EBAY_CLIENT_SECRET,
      devId: process.env.EBAY_DEV_ID,
      sandbox: process.env.EBAY_SANDBOX === 'true',
      marketplace: process.env.EBAY_MARKETPLACE || 'EBAY-US'
    };
    
    this.baseUrl = this.config.sandbox ? 
      'https://api.sandbox.ebay.com' : 
      'https://api.ebay.com';
    
    this.marketplaceEndpoints = {
      'EBAY-US': 'https://api.ebay.com',
      'EBAY-CA': 'https://api.ebay.com',
      'EBAY-UK': 'https://api.ebay.com',
      'EBAY-DE': 'https://api.ebay.com',
      'EBAY-FR': 'https://api.ebay.com',
      'EBAY-IT': 'https://api.ebay.com',
      'EBAY-ES': 'https://api.ebay.com',
      'EBAY-AU': 'https://api.ebay.com'
    };
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get OAuth access token
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${this.config.appId}:${this.config.certId}`).toString('base64');
      
      const response = await axios.post(`${this.baseUrl}/identity/v1/oauth2/token`, 
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting eBay access token:', error);
      throw new Error('Failed to authenticate with eBay API');
    }
  }

  // Search eBay items
  async searchItems(keywords, categoryId = null, minPrice = null, maxPrice = null, sortBy = 'bestMatch') {
    try {
      const token = await this.getAccessToken();
      
      const params = {
        q: keywords,
        limit: 50,
        sort: sortBy
      };

      if (categoryId) params.category_ids = categoryId;
      if (minPrice) params.filter = `price:[${minPrice}..]`;
      if (maxPrice) {
        const filter = params.filter || '';
        params.filter = filter ? `${filter},price:[..${maxPrice}]` : `price:[..${maxPrice}]`;
      }

      const response = await axios.get(`${this.baseUrl}/buy/browse/v1/item_summary/search`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': this.config.marketplace
        },
        params
      });

      return this.parseSearchResults(response.data);
    } catch (error) {
      console.error('Error searching eBay items:', error);
      throw new Error('Failed to search eBay items');
    }
  }

  // Get item details by item ID
  async getItemDetails(itemId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseUrl}/buy/browse/v1/item/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': this.config.marketplace
        }
      });

      return this.parseItemDetails(response.data);
    } catch (error) {
      console.error('Error getting item details:', error);
      throw new Error('Failed to get item details');
    }
  }

  // Parse search results from eBay API response
  parseSearchResults(data) {
    try {
      const items = data.itemSummaries || [];
      
      const parsedItems = items.map(item => {
        const price = item.price || {};
        const shippingCost = item.shippingOptions?.[0]?.shippingCost || {};
        
        return {
          itemId: item.itemId || '',
          title: item.title || '',
          description: item.shortDescription || '',
          category: item.categoryPath || '',
          price: parseFloat(price.value || 0),
          currency: price.currency || 'USD',
          originalPrice: parseFloat(item.price?.originalPrice?.value || price.value || 0),
          discountPercentage: item.price?.originalPrice ? 
            ((parseFloat(item.price.originalPrice.value) - parseFloat(price.value)) / parseFloat(item.price.originalPrice.value)) * 100 : 0,
          rating: parseFloat(item.itemRating?.rating || 0),
          ratingCount: parseInt(item.itemRating?.ratingCount || 0),
          availability: item.itemLocation?.country || 'US',
          condition: item.condition || 'Used',
          freeShipping: parseFloat(shippingCost.value || 0) === 0,
          shippingCost: parseFloat(shippingCost.value || 0),
          images: item.image?.imageUrl ? [item.image.imageUrl] : [],
          seller: {
            username: item.seller?.username || '',
            feedbackScore: parseInt(item.seller?.feedbackScore || 0),
            positiveFeedbackPercentage: parseFloat(item.seller?.positiveFeedbackPercentage || 0)
          },
          location: {
            city: item.itemLocation?.city || '',
            state: item.itemLocation?.stateOrProvince || '',
            country: item.itemLocation?.country || '',
            postalCode: item.itemLocation?.postalCode || ''
          },
          specifications: {
            brand: item.additionalImages?.[0]?.title || '',
            model: item.additionalImages?.[0]?.title || '',
            weight: item.shippingOptions?.[0]?.shippingCost?.value || '',
            dimensions: {
              length: 0,
              width: 0,
              height: 0,
              unit: 'inches'
            }
          },
          url: item.itemWebUrl || '',
          listingType: item.listingType || 'FIXED_PRICE',
          endTime: item.itemEndDate || null,
          bidCount: parseInt(item.bidCount || 0),
          watchCount: parseInt(item.watchCount || 0)
        };
      });

      return {
        items: parsedItems,
        totalResults: parseInt(data.total || 0),
        searchKeywords: data.searchKeywords || '',
        category: data.categoryPath || ''
      };
    } catch (error) {
      console.error('Error parsing search results:', error);
      return {
        items: [],
        totalResults: 0,
        searchKeywords: '',
        category: ''
      };
    }
  }

  // Parse item details from eBay API response
  parseItemDetails(item) {
    try {
      const price = item.price || {};
      const shippingCost = item.shippingOptions?.[0]?.shippingCost || {};
      
      return {
        itemId: item.itemId || '',
        title: item.title || '',
        description: item.description || '',
        category: item.categoryPath || '',
        price: parseFloat(price.value || 0),
        currency: price.currency || 'USD',
        originalPrice: parseFloat(item.price?.originalPrice?.value || price.value || 0),
        discountPercentage: item.price?.originalPrice ? 
          ((parseFloat(item.price.originalPrice.value) - parseFloat(price.value)) / parseFloat(item.price.originalPrice.value)) * 100 : 0,
        rating: parseFloat(item.itemRating?.rating || 0),
        ratingCount: parseInt(item.itemRating?.ratingCount || 0),
        availability: item.itemLocation?.country || 'US',
        condition: item.condition || 'Used',
        freeShipping: parseFloat(shippingCost.value || 0) === 0,
        shippingCost: parseFloat(shippingCost.value || 0),
        images: item.additionalImages ? 
          item.additionalImages.map(img => img.imageUrl).filter(Boolean) : 
          (item.image?.imageUrl ? [item.image.imageUrl] : []),
        seller: {
          username: item.seller?.username || '',
          feedbackScore: parseInt(item.seller?.feedbackScore || 0),
          positiveFeedbackPercentage: parseFloat(item.seller?.positiveFeedbackPercentage || 0),
          topRatedSeller: item.seller?.topRatedSeller || false
        },
        location: {
          city: item.itemLocation?.city || '',
          state: item.itemLocation?.stateOrProvince || '',
          country: item.itemLocation?.country || '',
          postalCode: item.itemLocation?.postalCode || ''
        },
        specifications: {
          brand: item.brand || '',
          model: item.model || '',
          weight: item.shippingOptions?.[0]?.shippingCost?.value || '',
          dimensions: {
            length: 0,
            width: 0,
            height: 0,
            unit: 'inches'
          }
        },
        url: item.itemWebUrl || '',
        listingType: item.listingType || 'FIXED_PRICE',
        endTime: item.itemEndDate || null,
        bidCount: parseInt(item.bidCount || 0),
        watchCount: parseInt(item.watchCount || 0),
        returnPolicy: item.returnPolicy || {},
        shippingOptions: item.shippingOptions || [],
        itemAspects: item.itemAspects || [],
        topRatedBuyingExperience: item.topRatedBuyingExperience || false,
        lotSize: parseInt(item.lotSize || 1),
        adultOnly: item.adultOnly || false,
        bundle: item.bundle || false
      };
    } catch (error) {
      console.error('Error parsing item details:', error);
      throw new Error('Failed to parse item details');
    }
  }

  // Get trending items
  async getTrendingItems(categoryId = null, limit = 20) {
    try {
      const token = await this.getAccessToken();
      
      const params = {
        limit: limit
      };

      if (categoryId) params.category_ids = categoryId;

      const response = await axios.get(`${this.baseUrl}/buy/browse/v1/item_summary/search`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': this.config.marketplace
        },
        params: {
          ...params,
          sort: 'watchCountDecreaseSort'
        }
      });

      return this.parseSearchResults(response.data);
    } catch (error) {
      console.error('Error getting trending items:', error);
      throw new Error('Failed to get trending items');
    }
  }

  // Get deals
  async getDeals(categoryId = null, minDiscount = 20) {
    try {
      const token = await this.getAccessToken();
      
      const params = {
        limit: 50,
        filter: `price:[..],discountPercentage:[${minDiscount}..]`
      };

      if (categoryId) params.category_ids = categoryId;

      const response = await axios.get(`${this.baseUrl}/buy/browse/v1/item_summary/search`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': this.config.marketplace
        },
        params: {
          ...params,
          sort: 'discountPercentageDecreaseSort'
        }
      });

      return this.parseSearchResults(response.data);
    } catch (error) {
      console.error('Error getting deals:', error);
      throw new Error('Failed to get deals');
    }
  }

  // Get categories
  async getCategories(parentCategoryId = null) {
    try {
      const token = await this.getAccessToken();
      
      const url = parentCategoryId ? 
        `${this.baseUrl}/commerce/taxonomy/v1/get_default_category_tree_id` :
        `${this.baseUrl}/commerce/taxonomy/v1/category_tree/${parentCategoryId}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': this.config.marketplace
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to get categories');
    }
  }

  // Create or update eBay product in our system
  async createOrUpdateProduct(eBayData) {
    try {
      const em = this.DI.em;
      const productRepository = em.getRepository('eBayProduct');
      
      // Check if product already exists
      let product = await productRepository.findOne({ itemId: eBayData.itemId });
      
      if (product) {
        // Update existing product
        product.title = eBayData.title;
        product.description = eBayData.description;
        product.price = eBayData.price;
        product.originalPrice = eBayData.originalPrice;
        product.discountPercentage = eBayData.discountPercentage;
        product.condition = eBayData.condition;
        product.shippingCost = eBayData.shippingCost;
        product.freeShipping = eBayData.freeShipping;
        product.images = eBayData.images;
        product.seller = eBayData.seller;
        product.location = eBayData.location;
        product.specifications = eBayData.specifications;
        product.url = eBayData.url;
        product.listingType = eBayData.listingType;
        product.endTime = eBayData.endTime;
        product.bidCount = eBayData.bidCount;
        product.watchCount = eBayData.watchCount;
        product.updatedAt = new Date();
      } else {
        // Create new product
        product = productRepository.create({
          itemId: eBayData.itemId,
          title: eBayData.title,
          description: eBayData.description,
          category: eBayData.category,
          price: eBayData.price,
          originalPrice: eBayData.originalPrice,
          discountPercentage: eBayData.discountPercentage,
          condition: eBayData.condition,
          shippingCost: eBayData.shippingCost,
          freeShipping: eBayData.freeShipping,
          images: eBayData.images,
          seller: eBayData.seller,
          location: eBayData.location,
          specifications: eBayData.specifications,
          url: eBayData.url,
          listingType: eBayData.listingType,
          endTime: eBayData.endTime,
          bidCount: eBayData.bidCount,
          watchCount: eBayData.watchCount,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      await em.persistAndFlush(product);
      return product;
    } catch (error) {
      console.error('Error creating/updating eBay product:', error);
      throw new Error('Failed to create/update eBay product');
    }
  }

  // Sync eBay user data
  async syncEBayUserData(eBayUserId) {
    try {
      const em = this.DI.em;
      const userRepository = em.getRepository('eBayUser');
      
      // This would typically involve getting user data from eBay API
      // For now, we'll create a placeholder
      let user = await userRepository.findOne({ eBayUserId });
      
      if (!user) {
        user = userRepository.create({
          eBayUserId,
          username: `eBay_User_${eBayUserId}`,
          feedbackScore: 0,
          positiveFeedbackPercentage: 0,
          topRatedSeller: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await em.persistAndFlush(user);
      }
      
      return user;
    } catch (error) {
      console.error('Error syncing eBay user data:', error);
      throw new Error('Failed to sync eBay user data');
    }
  }
}

module.exports = eBayService; 