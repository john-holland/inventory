import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Chip,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { useInventory } from '../context/InventoryContext';

const AddItemScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addItem, updateItem, loading } = useInventory();
  
  const editItem = route.params?.editItem;
  const isEditing = !!editItem;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    condition: '',
    quantity: '1',
    weight: '',
    dimensions: '',
    shippingCost: '',
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (editItem) {
      setFormData({
        title: editItem.title || '',
        description: editItem.description || '',
        category: editItem.category || '',
        price: editItem.price?.toString() || '',
        condition: editItem.condition || '',
        quantity: editItem.quantity?.toString() || '1',
        weight: editItem.weight?.toString() || '',
        dimensions: editItem.dimensions || '',
        shippingCost: editItem.shippingCost?.toString() || '',
      });
      if (editItem.imageUrl) {
        setImages([{ uri: editItem.imageUrl }]);
      }
    }
  }, [editItem]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.condition) {
      newErrors.condition = 'Condition is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => launchCamera({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
          }, handleImageResponse),
        },
        {
          text: 'Photo Library',
          onPress: () => launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
            selectionLimit: 5,
          }, handleImageResponse),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleImageResponse = (response) => {
    if (response.didCancel) return;

    if (response.errorCode) {
      showSnackbar('Error selecting image: ' + response.errorMessage);
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const newImages = response.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || `image_${Date.now()}.jpg`,
      }));
      setImages(prev => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form');
      return;
    }

    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        weight: parseFloat(formData.weight) || 0,
        shippingCost: parseFloat(formData.shippingCost) || 0,
        images: images,
      };

      if (isEditing) {
        await updateItem(editItem.id, itemData);
        showSnackbar('Item updated successfully');
      } else {
        await addItem(itemData);
        showSnackbar('Item added successfully');
      }

      navigation.goBack();
    } catch (error) {
      showSnackbar('Error saving item: ' + error.message);
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const renderImagePreview = () => (
    <View style={styles.imageSection}>
      <Text style={styles.sectionTitle}>Images</Text>
      <TouchableOpacity style={styles.imageUploadButton} onPress={handleImagePicker}>
        <Icon name="add-a-photo" size={32} color={theme.colors.primary} />
        <Text style={styles.uploadText}>Add Images</Text>
        <Text style={styles.uploadSubtext}>Tap to add up to 5 images</Text>
      </TouchableOpacity>
      
      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Icon name="close" size={16} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Card.Content>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <TextInput
                label="Title"
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                style={styles.input}
                mode="outlined"
                error={!!errors.title}
                theme={theme}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

              <TextInput
                label="Description"
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
                error={!!errors.description}
                theme={theme}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Category</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.category}
                    onValueChange={(value) => updateFormData('category', value)}
                    style={styles.picker}
                    dropdownIconColor={theme.colors.text}
                  >
                    <Picker.Item label="Select category" value="" />
                    <Picker.Item label="Electronics" value="electronics" />
                    <Picker.Item label="Furniture" value="furniture" />
                    <Picker.Item label="Clothing" value="clothing" />
                    <Picker.Item label="Books" value="books" />
                    <Picker.Item label="Tools" value="tools" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </View>
            </View>

            {/* Pricing & Condition */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing & Condition</Text>
              
              <TextInput
                label="Price ($)"
                value={formData.price}
                onChangeText={(text) => updateFormData('price', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.price}
                theme={theme}
              />
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Condition</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.condition}
                    onValueChange={(value) => updateFormData('condition', value)}
                    style={styles.picker}
                    dropdownIconColor={theme.colors.text}
                  >
                    <Picker.Item label="Select condition" value="" />
                    <Picker.Item label="New" value="new" />
                    <Picker.Item label="Like New" value="like_new" />
                    <Picker.Item label="Good" value="good" />
                    <Picker.Item label="Fair" value="fair" />
                    <Picker.Item label="Poor" value="poor" />
                  </Picker>
                </View>
                {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
              </View>

              <TextInput
                label="Quantity"
                value={formData.quantity}
                onChangeText={(text) => updateFormData('quantity', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                theme={theme}
              />
            </View>

            {/* Physical Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Physical Details</Text>
              
              <View style={styles.row}>
                <TextInput
                  label="Weight (lbs)"
                  value={formData.weight}
                  onChangeText={(text) => updateFormData('weight', text)}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                  theme={theme}
                />
                <TextInput
                  label="Dimensions"
                  value={formData.dimensions}
                  onChangeText={(text) => updateFormData('dimensions', text)}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="L x W x H inches"
                  theme={theme}
                />
              </View>

              <TextInput
                label="Shipping Cost ($)"
                value={formData.shippingCost}
                onChangeText={(text) => updateFormData('shippingCost', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                theme={theme}
              />
            </View>

            {/* Images */}
            {renderImagePreview()}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={[styles.button, styles.cancelButton]}
            textColor={theme.colors.text}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={[styles.button, styles.submitButton]}
            loading={loading}
            disabled={loading}
          >
            {isEditing ? 'Update Item' : 'Save Item'}
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  formCard: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  pickerContainer: {
    marginBottom: theme.spacing.md,
  },
  pickerLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  picker: {
    color: theme.colors.text,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  imageSection: {
    marginBottom: theme.spacing.xl,
  },
  imageUploadButton: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  uploadSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  imageList: {
    marginTop: theme.spacing.md,
  },
  imageContainer: {
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.danger,
    borderRadius: theme.borderRadius.round,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  cancelButton: {
    borderColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  snackbar: {
    backgroundColor: theme.colors.surface,
  },
});

export default AddItemScreen; 