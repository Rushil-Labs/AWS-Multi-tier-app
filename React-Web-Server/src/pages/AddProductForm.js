import React, { useState, useRef, useEffect } from "react";
import Notification from "../components/Notification";

function AddProductForm() {
  const initialFormState = {
    category: "",
    gender: "",
    productName: "",
    size: "",
    price: "",
    count: "",
    description: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    // Create the preview URL when image file changes
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImageFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.category.trim()) errors.category = "Category is required";
    if (!formData.gender.trim()) errors.gender = "Gender is required";
    if (!formData.productName.trim()) errors.productName = "Product name is required";
    if (!formData.size.trim()) errors.size = "Size is required";
    
    if (!formData.price.trim()) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = "Price must be a positive number";
    }
    
    if (!formData.count.trim()) {
      errors.count = "Count is required";
    } else if (!Number.isInteger(Number(formData.count)) || Number(formData.count) <= 0) {
      errors.count = "Count must be a positive integer";
    }
    
    if (!formData.description.trim()) errors.description = "Description is required";
    if (!imageFile) errors.image = "Product image is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setImageFile(null);
    setFormErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({
        show: true,
        message: "Please fix the errors in the form",
        type: "error"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add all product data to FormData
      formDataToSend.append('category', formData.category);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('productName', formData.productName);
      formDataToSend.append('size', formData.size);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('count', formData.count);
      formDataToSend.append('description', formData.description);

      // Add image if one was selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
      
      // Send everything to Python backend
      const response = await fetch(`${apiBaseUrl}/add-product`, {
        method: "POST",
        body: formDataToSend  // Don't set Content-Type header, let browser set it with boundary
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to add product");
      }

      // Create an image preview URL if available in the response
      const imageUrl = result.imageUrl || URL.createObjectURL(imageFile);
      
      setNotification({
        show: true,
        message: (
          <div>
            <p>Product added successfully!</p>
            <p style={{ fontSize: '14px', margin: '5px 0' }}>
              <strong>Product:</strong> {formData.productName}
            </p>
            <img 
              src={imageUrl} 
              alt="Product preview" 
              style={{ 
                maxWidth: '100px', 
                maxHeight: '100px', 
                marginTop: '5px',
                borderRadius: '4px',
                objectFit: 'contain'
              }} 
            />
          </div>
        ),
        type: "success"
      });

      // Reset the form and scroll to top
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      setNotification({
        show: true,
        message: err.message || "Failed to add product",
        type: "error"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: "0rem", maxWidth: "600px", margin: "auto" }}>
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification({ ...notification, show: false })}
          autoDismiss={3000}
        />
      )}
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {["category", "gender", "productName", "size", "price", "count"].map((field) => (
          <div key={field} style={{ marginBottom: "1rem" }}>
            <label>
              {field === 'productName' ? 'Product Name' : field.charAt(0).toUpperCase() + field.slice(1)}:
            </label>
            <input
              name={field}
              value={formData[field]}
              onChange={handleChange}
              style={{ 
                width: "100%", 
                padding: "0.5rem",
                border: formErrors[field] ? '1px solid red' : '1px solid #ccc'
              }}
            />
            {formErrors[field] && (
              <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {formErrors[field]}
              </div>
            )}
          </div>
        ))}
        <div style={{ marginBottom: "1rem" }}>
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={{ 
              width: "100%", 
              padding: "0.5rem",
              minHeight: "100px",
              resize: "vertical",
              border: formErrors.description ? '1px solid red' : '1px solid #ccc'
            }}
          />
          {formErrors.description && (
            <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              {formErrors.description}
            </div>
          )}
        </div>

        <div
          onClick={triggerFileSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: formErrors.image ? "2px dashed red" : (dragActive ? "2px dashed #007bff" : "2px dashed #ccc"),
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
            marginBottom: "1rem",
            backgroundColor: dragActive ? "#f0f8ff" : "#fafafa",
            cursor: "pointer",
            transition: "0.2s ease",
          }}
        >
          {imageFile ? (
            <div>
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  marginBottom: '10px',
                  borderRadius: '4px'
                }}
              />
              <p style={{ margin: '10px 0' }}>
                <strong>Selected:</strong> {imageFile.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </p>
            </div>
          ) : (
            <p>Drag & drop image here, or click to browse</p>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
        {formErrors.image && (
          <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem', marginBottom: '1rem' }}>
            {formErrors.image}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          style={{
            backgroundColor: isUploading ? "#cccccc" : "green",
            color: "white",
            padding: "0.5rem 1rem",
            cursor: isUploading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          {isUploading ? "Adding Product..." : "Finish"}
        </button>
      </form>
    </div>
  );
}

export default AddProductForm;
