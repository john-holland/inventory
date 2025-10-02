import React, { useState } from 'react';
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Alert, 
    Card, 
    CardContent,
    Grid
} from '@mui/material';
import { 
    ward, 
    assertdown, 
    wardString, 
    wardNumber, 
    wardAddress,
    wardArray,
    wardObject 
} from '../utils/assertions';

/**
 * Example component demonstrating the use of ward and assertdown utility functions
 * This shows how the Solidity-like assertion pattern can be used in TypeScript/React
 */
export const ExampleUsage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        email: '',
        ethereumAddress: '',
        items: [] as string[]
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState<string>('');

    const validateForm = () => {
        const newErrors: string[] = [];

        try {
            // Using assertdown for batch validation - collects all errors before failing
            assertdown((tri) => {
                // Simple boolean checks
                tri(() => ward(formData.name.length > 0, 'Name is required'));
                tri(() => ward(formData.age !== '', 'Age is required'));
                tri(() => ward(Number(formData.age) >= 18, 'Must be at least 18 years old'));

                // String validation
                tri(() => wardString(formData.name, 'Name must be a valid string', 2));
                tri(() => wardString(formData.email, 'Email must be a valid string'));

                // Number validation
                tri(() => wardNumber(Number(formData.age), 'Age must be a valid number', 18, 120));

                // Ethereum address validation (if provided)
                if (formData.ethereumAddress) {
                    tri(() => wardAddress(formData.ethereumAddress, 'Invalid Ethereum address'));
                }

                // Complex conditions
                tri(() => ward(
                    formData.email.includes('@') && formData.email.includes('.'),
                    'Email must contain @ and a domain'
                ));

                // Array validation
                tri(() => wardArray(formData.items, 'Items must be an array'));

                // Object validation
                tri(() => wardObject(formData, 'Form data must be an object', ['name', 'age']));
            }, { formData });

            setSuccess('✅ All validations passed! Form data is valid.');
            setErrors([]);

        } catch (error) {
            if (error instanceof Error) {
                newErrors.push(error.message);
            } else {
                newErrors.push('Unknown validation error');
            }
            setErrors(newErrors);
            setSuccess('');
        }
    };

    const validateFormIndividually = () => {
        const newErrors: string[] = [];

        try {
            // Individual ward calls - stops at first error
            ward(formData.name.length > 0, 'Name is required');
            ward(formData.age !== '', 'Age is required');
            ward(Number(formData.age) >= 18, 'Must be at least 18 years old');
            wardString(formData.name, 'Name must be a valid string', 2);
            wardString(formData.email, 'Email must be a valid string');
            wardNumber(Number(formData.age), 'Age must be a valid number', 18, 120);

            setSuccess('✅ Individual validations passed!');
            setErrors([]);

        } catch (error) {
            if (error instanceof Error) {
                newErrors.push(error.message);
            } else {
                newErrors.push('Unknown validation error');
            }
            setErrors(newErrors);
            setSuccess('');
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors([]);
        setSuccess('');
    };

    const addItem = () => {
        const newItem = `Item ${formData.items.length + 1}`;
        setFormData(prev => ({ 
            ...prev, 
            items: [...prev.items, newItem] 
        }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({ 
            ...prev, 
            items: prev.items.filter((_, i) => i !== index) 
        }));
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Ward & Assertdown Examples
            </Typography>
            
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                This demonstrates the Solidity-like assertion pattern in TypeScript/React.
                The ward() function provides immediate error throwing, while assertdown() 
                collects all validation errors before failing - perfect for batch validation.
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Form Validation Example
                    </Typography>
                    
                    <TextField
                        fullWidth
                        label="Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        margin="normal"
                        helperText="Must be at least 2 characters"
                    />
                    
                    <TextField
                        fullWidth
                        label="Age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        margin="normal"
                        helperText="Must be 18 or older"
                    />
                    
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        margin="normal"
                        helperText="Must contain @ and domain"
                    />
                    
                    <TextField
                        fullWidth
                        label="Ethereum Address (optional)"
                        value={formData.ethereumAddress}
                        onChange={(e) => handleInputChange('ethereumAddress', e.target.value)}
                        margin="normal"
                        helperText="Must be valid Ethereum address format"
                    />

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Items Array:
                        </Typography>
                        {formData.items.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <Typography sx={{ flex: 1 }}>{item}</Typography>
                                <Button 
                                    size="small" 
                                    variant="outlined" 
                                    color="error"
                                    onClick={() => removeItem(index)}
                                >
                                    Remove
                                </Button>
                            </Box>
                        ))}
                        <Button onClick={addItem} variant="outlined" size="small">
                            Add Item
                        </Button>
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button 
                            variant="contained" 
                            onClick={validateForm}
                            fullWidth
                        >
                            Validate All (Batch)
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={validateFormIndividually}
                            fullWidth
                        >
                            Validate Individually
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Validation Errors:
                    </Typography>
                    {errors.map((error, index) => (
                        <Typography key={index} variant="body2">
                            • {error}
                        </Typography>
                    ))}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Individual Ward Examples
                            </Typography>
                            
                            <Typography variant="body2" component="pre" sx={{ 
                                backgroundColor: '#f5f5f5', 
                                p: 2, 
                                borderRadius: 1,
                                overflow: 'auto',
                                fontSize: '0.8rem'
                            }}>
{`// Simple boolean assertion
ward(user.isLoggedIn, 'User must be logged in');

// String validation
wardString(user.name, 'Name is required', 2);

// Number validation with range
wardNumber(user.age, 'Age must be valid', 18, 120);

// Ethereum address validation
wardAddress(user.wallet, 'Invalid wallet address');

// Array validation
wardArray(user.items, 'Items must be an array', 1);

// Object validation with required keys
wardObject(user, 'User object is invalid', ['id', 'name']);`}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Batch Assertdown Examples
                            </Typography>
                            
                            <Typography variant="body2" component="pre" sx={{ 
                                backgroundColor: '#f5f5f5', 
                                p: 2, 
                                borderRadius: 1,
                                overflow: 'auto',
                                fontSize: '0.8rem'
                            }}>
{`// Batch validation - collects all errors
assertdown((tri) => {
  tri(() => wardString(name, 'Name required'));
  tri(() => wardNumber(age, 'Age required', 18));
  tri(() => wardAddress(wallet, 'Invalid wallet'));
  tri(() => ward(email.includes('@'), 'Invalid email'));
}, { name, age, wallet, email });

// Constructor validation
constructor(params) {
  assertdown((tri) => {
    tri(() => wardString(params.name, 'Name required'));
    tri(() => wardNumber(params.age, 'Age required'));
    tri(() => wardAddress(params.address, 'Invalid address'));
  }, params);
}`}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Card sx={{ mt: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Key Benefits
                    </Typography>
                    
                    <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                        <li><strong>ward()</strong> - Immediate error throwing, stops at first failure</li>
                        <li><strong>assertdown()</strong> - Batch validation, collects all errors before failing</li>
                        <li><strong>Developer Efficiency</strong> - See all validation issues at once</li>
                        <li><strong>Constructor Safety</strong> - Validate all parameters before object creation</li>
                        <li><strong>Consistent Error Handling</strong> - Same pattern across Solidity and TypeScript</li>
                        <li><strong>Stack Busting</strong> - Clear error traces for debugging</li>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}; 