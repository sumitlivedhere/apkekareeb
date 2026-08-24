import React, { useState, useRef, useEffect } from 'react';
import { uploadListingImagesToStorage, publishHyperlocalListing } from '../../services/listingService';
import { getCategoryById } from '../../data/taxonomyRegistry';

const CATEGORY_OPTIONS = [
  { id: 'property', label: '🏢 Property & Real Estate' },
  { id: 'market', label: '🛒 Market, Retail & Deals' },
  { id: 'recommerce', label: '🛍️ Second-Hand & Thrift' },
  { id: 'kaarigar', label: '🛠️ Kaarigar & Mistri Service' },
  { id: 'medical', label: '🩺 Medical, Clinic & Doctors' },
  { id: 'fitness', label: '🏋️ Gyms, Fitness & Trainers' },
  { id: 'education', label: '📚 Coaching, Tuition & Schools' },
  { id: 'festival', label: '🎪 Festival Offers & Melas' },
  { id: 'shaadi', label: '💍 Wedding & Event Vendor' },
  { id: 'construction', label: '🏗️ Construction & Material' },
  { id: 'advertising', label: '📢 Wall, Rooftop & Ad Spaces' },
  { id: 'creators', label: '🎬 Digital Creators & Editors' },
  { id: 'white-collar', label: '👔 Professional Consultants' },
  { id: 'restaurants', label: '🍔 Food, Cafe & Restaurants' },
  { id: 'community', label: '🤝 Community Drive & Seva' },
];

export default function PostListingModal({
  defaultCategory = 'property',
  selectedCity = 'Alwar',
  onClose,
  onSuccess,
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [subCategory, setSubCategory] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState(`Budh Vihar, ${selectedCity}`);
  const [description, setDescription] = useState('');

  // 📸 Multi-Image Upload & Preview State
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressProgress, setCompressProgress] = useState('');

  // Fetch subcategories dynamically from taxonomy registry
  const categoryConfig = getCategoryById(category);
  const availableSubCategories = categoryConfig?.subCategories || [];

  // Update default subCategory when category changes
  useEffect(() => {
    if (availableSubCategories.length > 0) {
      setSubCategory(availableSubCategories[0].id);
    } else {
      setSubCategory(category);
    }
  }, [category]);

  const handlePhotoCapture = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 5 - selectedFiles.length;
    if (remaining <= 0) {
      alert('You can upload up to 5 photos.');
      return;
    }

    const newFiles = files.slice(0, remaining);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    setCompressProgress('Compressing photos into WebP...');

    // 1. Hardware-Accelerated Multi-Photo Compression & Upload
    let finalImageUrls = [];
    if (selectedFiles.length > 0) {
      finalImageUrls = await uploadListingImagesToStorage(selectedFiles, {
        maxWidth: 1200,
        quality: 0.75,
        onProgress: (done, total) => {
          setCompressProgress(`Compressed ${done}/${total} photos...`);
        },
      });
    }

    const fallbackImg =
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700';
    const imagesArray =
      finalImageUrls.length > 0 ? finalImageUrls : [fallbackImg];

    // 2. Format Price
    const rawNum = Number(price);
    const formattedPrice =
      !isNaN(rawNum) && rawNum > 0
        ? `₹ ${rawNum.toLocaleString('en-IN')}`
        : price.trim() || 'Contact for Price';

    // 3. Construct Payload with Matching Schema
    const cleanPhone = phone.replace(/\D/g, '');
    const listingPayload = {
      title: title.trim(),
      name: title.trim(),
      category,
      subCategory: subCategory || category,
      price: formattedPrice,
      rates: formattedPrice,
      sellerName: sellerName.trim() || 'Verified Local Member',
      phone: cleanPhone,
      whatsapp: cleanPhone,
      location: location.trim() || selectedCity,
      city: selectedCity,
      description: description.trim(),
      image: imagesArray[0],
      images: imagesArray,
      image_urls: imagesArray,
      interestCount: 0,
      interest_count: 0,
      isNew: true,
      badge: '🟢 Newly Listed',
    };

    // 4. Publish to DB and Store
    await publishHyperlocalListing(category, listingPayload);

    setIsSubmitting(false);
    if (onSuccess) onSuccess(listingPayload);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              ➕ Post New Listing / Offering
            </h2>
            <p className="text-[10px] text-slate-500">
              Broadcast directly to your town 5 km feed in {selectedCity}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer active:scale-95 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1">
          
          {/* Category Selector */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Sub-Category Selector (Appears for Shaadi & categories with sub-specialties) */}
          {availableSubCategories.length > 0 && (
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Sub-Specialty / Category Type *
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-hidden focus:border-rose-400"
              >
                {availableSubCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.icon ? `${sub.icon} ` : ''}{sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
              Title / Offering Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2 BHK Floor / Samsung M31 / AC Repair"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-hidden focus:border-cyan-600"
            />
          </div>

          {/* Price & Seller Name */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Price / Rate (₹)
              </label>
              <input
                type="text"
                placeholder="₹ 8,500 / Visiting ₹200"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-hidden focus:border-cyan-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sharma Ji"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-hidden"
              />
            </div>
          </div>

          {/* Phone & Area */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                WhatsApp / Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-hidden focus:border-cyan-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Colony / Landmark
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
              Description & Highlights
            </label>
            <textarea
              rows="2"
              placeholder="Key specifications, condition, timings, features, warranty..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:border-cyan-600"
            />
          </div>

          {/* Multi-Photo Fast Upload Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-slate-400 block">
                Photos ({previewUrls.length}/5)
              </label>
              <span className="text-[9px] font-bold text-emerald-600">
                ⚡ Auto WebP Compression
              </span>
            </div>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previewUrls.map((src, i) => (
                  <div
                    key={i}
                    className="relative h-18 rounded-xl overflow-hidden border border-slate-200 shadow-xs"
                  >
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 rounded-xs">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black cursor-pointer shadow-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previewUrls.length < 5 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-200 hover:border-cyan-400 bg-cyan-50/30 rounded-2xl p-3 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 transition"
              >
                <span className="text-base">📸</span>
                <span className="text-xs font-bold text-cyan-800">
                  + Add Photos (Camera / Gallery)
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoCapture}
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? compressProgress || 'Publishing...'
              : '🚀 Publish in Town 5 km Feed'}
          </button>
        </form>
      </div>
    </div>
  );
}