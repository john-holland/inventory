const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');

class AmazonService {
  constructor(DI) {
    this.DI = DI;
    this.config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      associateTag: process.env.AMAZON_ASSOCIATE_TAG,
      marketplace: process.env.AMAZON_MARKETPLACE || 'US',
      region: process.env.AWS_REGION || 'us-east-1',
      apiVersion: '2013-08-01'
    };
    
    this.marketplaceEndpoints = {
      'US': 'webservices.amazon.com',
      'CA': 'webservices.amazon.ca',
      'UK': 'webservices.amazon.co.uk',
      'DE': 'webservices.amazon.de',
      'FR': 'webservices.amazon.fr',
      'IT': 'webservices.amazon.it',
      'ES': 'webservices.amazon.es',
      'JP': 'webservices.amazon.co.jp',
      'IN': 'webservices.amazon.in',
      'BR': 'webservices.amazon.com.br',
      'MX': 'webservices.amazon.com.mx',
      'AU': 'webservices.amazon.com.au'
    };
  }

  // Generate Amazon API signature
  generateSignature(stringToSign, secretKey) {
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(stringToSign);
    return hmac.digest('base64');
  }

  // Create signed URL for Amazon API requests
  createSignedUrl(operation, params) {
    const timestamp = new Date().toISOString();
    const endpoint = this.marketplaceEndpoints[this.config.marketplace];
    
    const queryParams = {
      Service: 'AWSECommerceService',
      AWSAccessKeyId: this.config.accessKeyId,
      AssociateTag: this.config.associateTag,
      Operation: operation,
      Version: this.apiVersion,
      Timestamp: timestamp,
      ...params
    };

    // Sort parameters alphabetically
    const sortedParams = Object.keys(queryParams)
      .sort()
      .reduce((result, key) => {
        result[key] = queryParams[key];
        return result;
      }, {});

    // Create query string
    const queryString = Object.entries(sortedParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    // Create string to sign
    const stringToSign = `GET\n${endpoint}\n/onca/xml\n${queryString}`;
    const signature = this.generateSignature(stringToSign, this.config.secretAccessKey);

    return `https://${endpoint}/onca/xml?${queryString}&Signature=${encodeURIComponent(signature)}`;
  }

  // Search Amazon products
  async searchProducts(keywords, category = null, minPrice = null, maxPrice = null, sortBy = 'relevance') {
    try {
      const params = {
        Keywords: keywords,
        SearchIndex: category || 'All',
        ResponseGroup: 'Medium,Offers,Images',
        Sort: sortBy
      };

      if (minPrice) params.MinimumPrice = minPrice;
      if (maxPrice) params.MaximumPrice = maxPrice;

      const url = this.createSignedUrl('ItemSearch', params);
      const response = await axios.get(url);
      
      return this.parseSearchResults(response.data);
    } catch (error) {
      console.error('Error searching Amazon products:', error);
      throw new Error('Failed to search Amazon products');
    }
  }

  // Get product details by ASIN
  async getProductDetails(asin) {
    try {
      const params = {
        ItemId: asin,
        ResponseGroup: 'Large,Offers,Images,Reviews'
      };

      const url = this.createSignedUrl('ItemLookup', params);
      const response = await axios.get(url);
      
      return this.parseProductDetails(response.data);
    } catch (error) {
      console.error('Error getting product details:', error);
      throw new Error('Failed to get product details');
    }
  }

  // Parse search results from Amazon API response
  async parseSearchResults(xmlData) {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);
      
      const items = result.ItemSearchResponse?.Items?.Item || [];
      const products = Array.isArray(items) ? items : [items];
      
      const parsedProducts = products.map(item => {
        const offers = item.Offers?.Offer || {};
        const offerListing = offers.OfferListing || {};
        const price = offerListing.Price || {};
        const originalPrice = offerListing.AmountSaved ? 
          parseFloat(offerListing.AmountSaved) + parseFloat(price.Amount || 0) : 
          parseFloat(price.Amount || 0);
        
        const currentPrice = parseFloat(price.Amount || 0);
        const discountPercentage = originalPrice > 0 ? 
          ((originalPrice - currentPrice) / originalPrice) * 100 : 0;

        return {
          asin: item.ASIN || '',
          title: item.ItemAttributes?.Title || '',
          description: item.ItemAttributes?.Feature ? 
            (Array.isArray(item.ItemAttributes.Feature) ? 
              item.ItemAttributes.Feature.join(' ') : 
              item.ItemAttributes.Feature) : '',
          category: item.ItemAttributes?.ProductGroup || '',
          price: currentPrice,
          originalPrice: originalPrice,
          discountPercentage: discountPercentage,
          rating: parseFloat(item.CustomerReviews?.AverageRating || 0),
          ratingCount: parseInt(item.CustomerReviews?.TotalReviews || 0),
          availability: item.Offers?.Offer?.OfferListing?.Availability || 'in_stock',
          primeEligible: item.Offers?.Offer?.OfferListing?.IsEligibleForPrime === '1',
          freeShipping: item.Offers?.Offer?.OfferListing?.IsEligibleForSuperSaverShipping === '1',
          images: item.ImageSets?.ImageSet ? 
            (Array.isArray(item.ImageSets.ImageSet) ? 
              item.ImageSets.ImageSet.map(img => img.LargeImage?.URL || img.MediumImage?.URL || img.SmallImage?.URL).filter(Boolean) :
              [item.ImageSets.ImageSet.LargeImage?.URL || item.ImageSets.ImageSet.MediumImage?.URL || item.ImageSets.ImageSet.SmallImage?.URL].filter(Boolean)) : [],
          features: item.ItemAttributes?.Feature ? 
            (Array.isArray(item.ItemAttributes.Feature) ? 
              item.ItemAttributes.Feature : [item.ItemAttributes.Feature]) : [],
          specifications: {
            brand: item.ItemAttributes?.Brand || '',
            manufacturer: item.ItemAttributes?.Manufacturer || '',
            model: item.ItemAttributes?.Model || '',
            weight: item.ItemAttributes?.ItemDimensions?.Weight || '',
            dimensions: {
              length: item.ItemAttributes?.ItemDimensions?.Length || 0,
              width: item.ItemAttributes?.ItemDimensions?.Width || 0,
              height: item.ItemAttributes?.ItemDimensions?.Height || 0,
              unit: item.ItemAttributes?.ItemDimensions?.Length ? 'inches' : 'inches'
            }
          }
        };
      });

      return {
        products: parsedProducts,
        totalResults: parseInt(result.ItemSearchResponse?.Items?.TotalResults || 0),
        searchKeywords: result.ItemSearchResponse?.Items?.Request?.ItemSearchRequest?.Keywords || '',
        category: result.ItemSearchResponse?.Items?.Request?.ItemSearchRequest?.SearchIndex || ''
      };
    } catch (error) {
      console.error('Error parsing search results:', error);
      return {
        products: [],
        totalResults: 0,
        searchKeywords: '',
        category: ''
      };
    }
  }

  // Parse product details from Amazon API response
  async parseProductDetails(xmlData) {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);
      
      const item = result.ItemLookupResponse?.Items?.Item;
      if (!item) {
        throw new Error('Product not found');
      }

      const offers = item.Offers?.Offer || {};
      const offerListing = offers.OfferListing || {};
      const price = offerListing.Price || {};
      const originalPrice = offerListing.AmountSaved ? 
        parseFloat(offerListing.AmountSaved) + parseFloat(price.Amount || 0) : 
        parseFloat(price.Amount || 0);
      
      const currentPrice = parseFloat(price.Amount || 0);
      const discountPercentage = originalPrice > 0 ? 
        ((originalPrice - currentPrice) / originalPrice) * 100 : 0;

      const product = {
        asin: item.ASIN || '',
        title: item.ItemAttributes?.Title || '',
        description: item.ItemAttributes?.Feature ? 
          (Array.isArray(item.ItemAttributes.Feature) ? 
            item.ItemAttributes.Feature.join(' ') : 
            item.ItemAttributes.Feature) : '',
        category: item.ItemAttributes?.ProductGroup || '',
        price: currentPrice,
        originalPrice: originalPrice,
        discountPercentage: discountPercentage,
        rating: parseFloat(item.CustomerReviews?.AverageRating || 0),
        ratingCount: parseInt(item.CustomerReviews?.TotalReviews || 0),
        availability: item.Offers?.Offer?.OfferListing?.Availability || 'in_stock',
        primeEligible: item.Offers?.Offer?.OfferListing?.IsEligibleForPrime === '1',
        freeShipping: item.Offers?.Offer?.OfferListing?.IsEligibleForSuperSaverShipping === '1',
        estimatedDelivery: item.Offers?.Offer?.OfferListing?.AvailabilityAttributes?.AvailabilityType === 'Now' ? 
          new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : null, // 2 days for Prime
        shippingWeight: parseFloat(item.ItemAttributes?.ItemDimensions?.Weight || 0),
        dimensions: {
          length: parseFloat(item.ItemAttributes?.ItemDimensions?.Length || 0),
          width: parseFloat(item.ItemAttributes?.ItemDimensions?.Width || 0),
          height: parseFloat(item.ItemAttributes?.ItemDimensions?.Height || 0),
          unit: 'inches'
        },
        images: item.ImageSets?.ImageSet ? 
          (Array.isArray(item.ImageSets.ImageSet) ? 
            item.ImageSets.ImageSet.map(img => img.LargeImage?.URL || img.MediumImage?.URL || img.SmallImage?.URL).filter(Boolean) :
            [item.ImageSets.ImageSet.LargeImage?.URL || item.ImageSets.ImageSet.MediumImage?.URL || item.ImageSets.ImageSet.SmallImage?.URL].filter(Boolean)) : [],
        features: item.ItemAttributes?.Feature ? 
          (Array.isArray(item.ItemAttributes.Feature) ? 
            item.ItemAttributes.Feature : [item.ItemAttributes.Feature]) : [],
        specifications: {
          brand: item.ItemAttributes?.Brand || '',
          manufacturer: item.ItemAttributes?.Manufacturer || '',
          model: item.ItemAttributes?.Model || '',
          weight: item.ItemAttributes?.ItemDimensions?.Weight || '',
          color: item.ItemAttributes?.Color || '',
          size: item.ItemAttributes?.Size || '',
          material: item.ItemAttributes?.Material || '',
          warranty: item.ItemAttributes?.Warranty || ''
        }
      };
      
      return product;
    } catch (error) {
      console.error('Error parsing product details:', error);
      throw new Error('Failed to parse product details');
    }
  }

  // Create or update Amazon product in our database
  async createOrUpdateProduct(amazonData) {
    try {
      let product = await this.DI.amazonProductRepository.findOne({
        amazonAsin: amazonData.asin
      });

      if (product) {
        // Update existing product
        const { wrap } = require("@mikro-orm/core");
        wrap(product).assign({
          title: amazonData.title,
          description: amazonData.description,
          price: amazonData.price,
          originalPrice: amazonData.originalPrice,
          discountPercentage: amazonData.discountPercentage,
          rating: amazonData.rating,
          ratingCount: amazonData.ratingCount,
          availability: amazonData.availability,
          primeEligible: amazonData.primeEligible,
          freeShipping: amazonData.freeShipping,
          images: amazonData.images,
          features: amazonData.features,
          specifications: amazonData.specifications,
          lastUpdated: new Date()
        });

        // Update price history
        if (amazonData.price !== product.price) {
          product.metadata.priceHistory.push({
            date: new Date(),
            price: amazonData.price,
            originalPrice: amazonData.originalPrice
          });
        }
      } else {
        // Create new product
        product = new this.DI.amazonProductRepository.entity(
          amazonData.asin,
          amazonData.title,
          amazonData.description,
          amazonData.category,
          amazonData.price,
          'USD',
          'active'
        );

        product.originalPrice = amazonData.originalPrice;
        product.discountPercentage = amazonData.discountPercentage;
        product.rating = amazonData.rating;
        product.ratingCount = amazonData.ratingCount;
        product.availability = amazonData.availability;
        product.primeEligible = amazonData.primeEligible;
        product.freeShipping = amazonData.freeShipping;
        product.images = amazonData.images;
        product.features = amazonData.features;
        product.specifications = amazonData.specifications;
        product.metadata.lastPriceUpdate = new Date();
        product.metadata.priceHistory = [{
          date: new Date(),
          price: amazonData.price,
          originalPrice: amazonData.originalPrice
        }];

        await this.DI.amazonProductRepository.persistAndFlush(product);
      }

      await this.DI.amazonProductRepository.flush();
      return product;
    } catch (error) {
      console.error('Error creating/updating Amazon product:', error);
      throw new Error('Failed to create/update Amazon product');
    }
  }

  // Get product recommendations
  async getProductRecommendations(asin, category = null) {
    try {
      const params = {
        ItemId: asin,
        ResponseGroup: 'Similarities'
      };

      const url = this.createSignedUrl('SimilarityLookup', params);
      const response = await axios.get(url);
      
      return this.parseRecommendations(response.data);
    } catch (error) {
      console.error('Error getting product recommendations:', error);
      throw new Error('Failed to get product recommendations');
    }
  }

  // Parse recommendations from Amazon API response
  async parseRecommendations(xmlData) {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);
      
      const items = result.SimilarityLookupResponse?.Items?.Item || [];
      const recommendations = Array.isArray(items) ? items : [items];
      
      return recommendations.map(item => ({
        asin: item.ASIN || '',
        title: item.ItemAttributes?.Title || '',
        price: parseFloat(item.Offers?.Offer?.OfferListing?.Price?.Amount || 0),
        rating: parseFloat(item.CustomerReviews?.AverageRating || 0),
        image: item.MediumImage?.URL || item.SmallImage?.URL || ''
      }));
    } catch (error) {
      console.error('Error parsing recommendations:', error);
      return [];
    }
  }

  // Get product reviews
  async getProductReviews(asin, page = 1) {
    try {
      const params = {
        ItemId: asin,
        ResponseGroup: 'Reviews',
        ReviewPage: page
      };

      const url = this.createSignedUrl('ItemLookup', params);
      const response = await axios.get(url);
      
      return this.parseReviews(response.data);
    } catch (error) {
      console.error('Error getting product reviews:', error);
      throw new Error('Failed to get product reviews');
    }
  }

  // Parse reviews from Amazon API response
  async parseReviews(xmlData) {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);
      
      const reviews = result.ItemLookupResponse?.Items?.Item?.CustomerReviews?.Review || [];
      const parsedReviews = Array.isArray(reviews) ? reviews : [reviews];
      
      return {
        reviews: parsedReviews.map(review => ({
          rating: parseInt(review.Rating || 0),
          title: review.Summary || '',
          content: review.Content || '',
          date: review.Date || '',
          reviewer: review.Reviewer?.Name || 'Anonymous',
          helpful: parseInt(review.HelpfulVotes || 0)
        })),
        totalReviews: parseInt(result.ItemLookupResponse?.Items?.Item?.CustomerReviews?.TotalReviews || 0),
        averageRating: parseFloat(result.ItemLookupResponse?.Items?.Item?.CustomerReviews?.AverageRating || 0)
      };
    } catch (error) {
      console.error('Error parsing reviews:', error);
      return {
        reviews: [],
        totalReviews: 0,
        averageRating: 0
      };
    }
  }

  // Check product availability and pricing
  async checkProductAvailability(asin) {
    try {
      const product = await this.DI.amazonProductRepository.findOne({
        amazonAsin: asin
      });

      if (!product) {
        throw new Error('Product not found in database');
      }

      // Get fresh data from Amazon
      const amazonData = await this.getProductDetails(asin);
      
      // Update product with fresh data
      const updatedProduct = await this.createOrUpdateProduct(amazonData);
      
      return {
        available: updatedProduct.availability === 'in_stock',
        price: updatedProduct.price,
        originalPrice: updatedProduct.originalPrice,
        discountPercentage: updatedProduct.discountPercentage,
        primeEligible: updatedProduct.primeEligible,
        freeShipping: updatedProduct.freeShipping,
        estimatedDelivery: updatedProduct.estimatedDelivery
      };
    } catch (error) {
      console.error('Error checking product availability:', error);
      throw new Error('Failed to check product availability');
    }
  }

  // Get trending products by category
  async getTrendingProducts(category, limit = 20) {
    try {
      const params = {
        SearchIndex: category,
        ResponseGroup: 'Medium,Offers',
        Sort: 'salesrank'
      };

      const url = this.createSignedUrl('ItemSearch', params);
      const response = await axios.get(url);
      
      const results = await this.parseSearchResults(response.data);
      return results.products.slice(0, limit);
    } catch (error) {
      console.error('Error getting trending products:', error);
      throw new Error('Failed to get trending products');
    }
  }

  // Get deals and discounts
  async getDeals(category = null, minDiscount = 20) {
    try {
      const params = {
        SearchIndex: category || 'All',
        ResponseGroup: 'Medium,Offers',
        Sort: 'price'
      };

      const url = this.createSignedUrl('ItemSearch', params);
      const response = await axios.get(url);
      
      const results = await this.parseSearchResults(response.data);
      
      // Filter products with significant discounts
      return results.products.filter(product => 
        product.discountPercentage >= minDiscount
      );
    } catch (error) {
      console.error('Error getting deals:', error);
      throw new Error('Failed to get deals');
    }
  }

  // Sync Amazon user data
  async syncAmazonUserData(amazonUserId) {
    try {
      const amazonUser = await this.DI.amazonUserRepository.findOne({
        amazonUserId: amazonUserId
      });

      if (!amazonUser) {
        throw new Error('Amazon user not found');
      }

      // Update last sync time
      const { wrap } = require("@mikro-orm/core");
      wrap(amazonUser).assign({
        lastSync: new Date()
      });

      await this.DI.amazonUserRepository.flush();

      return {
        success: true,
        lastSync: amazonUser.lastSync,
        syncStatus: 'completed'
      };
    } catch (error) {
      console.error('Error syncing Amazon user data:', error);
      throw new Error('Failed to sync Amazon user data');
    }
  }
}

module.exports = { AmazonService }; 