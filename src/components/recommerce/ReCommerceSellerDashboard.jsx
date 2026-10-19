import React, { useState, useRef } from 'react';
import { RE_COMMERCE_SUB_CATEGORIES, RE_COMMERCE_CONDITIONS } from '../../data/reCommerceData';
import { uploadListingImagesToStorage } from '../../services/listingService';
import { hyperlocalStore, CATEGORY_TTL_HOURS } from '../../store/hyperlocalStore';
import ListingDetailModal from '../common/ListingDetailModal';

export default function ReCommerceSellerDashboard({
  myListings = [],
  onAddNewListing,
  onToggleStatus,
  onBackToHub,
  selectedCity = 'Alwar',
}) {
  const [viewTab, setViewTab] = useState('add'); // 'add' | 'manage'
  const [isUploading, setIsUploading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subCategory, setSubCategory] = useState('mobiles');
  const [condition, setCondition] = useState('good');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [ageMonths, setAgeMonths] = useState('');
  const [hasBillOrBox, setHasBillOrBox] = useState(true);
  const [landmark, setLandmark] = useState(`Budh Vihar, ${selectedCity}`);
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [sellerName, setSellerName] = useState('');

  // 🖼️ Multi-Image Files & Previews State
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Multi-Photo Capture Handler
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
    if (!title.trim() || !price || !phone.trim()) return;

    setIsUploading(true);

    let uploadedUrls = [];
    if (selectedFiles.length > 0) {
      uploadedUrls = await uploadListingImagesToStorage(selectedFiles);
    }

    const fallbackImg =
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=700';
    const finalImages =
      uploadedUrls.length > 0 ? uploadedUrls : [fallbackImg];

    const cleanPrice = Number(price);
    const ttlHours = CATEGORY_TTL_HOURS.recommerce || (21 * 24);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    const newListing = {
      id: `rc_${Date.now()}`,
      title: title.trim(),
      name: title.trim(),
      category: 'recommerce',
      subCategory,
      rawPrice: cleanPrice,
      price: `₹ ${cleanPrice.toLocaleString('en-IN')}`,
      rates: `₹ ${cleanPrice.toLocaleString('en-IN')}`,
      isNegotiable,
      condition,
      ageMonths: Number(ageMonths) || 6,
      hasBillOrBox,
      description: description.trim() || 'Used item in clean working condition.',
      location: landmark.trim(),
      city: selectedCity,
      zone: `${selectedCity} - Central`,
      lat: 27.553,
      lng: 76.6346,
      image: finalImages[0],
      images: finalImages,
      image_urls: finalImages,
      sellerName: sellerName.trim() || 'Local Seller',
      seller: {
        name: sellerName.trim() || 'Local Seller',
        phone: phone.trim(),
        isVerified: true,
      },
      phone: phone.trim(),
      whatsapp: phone.trim(),
      interestCount: 0,
      interest_count: 0,
      status: 'ACTIVE',
      expires_at: expiresAt,
      badge: '🟢 Verified Citizen Listing',
      createdAt: new Date().toISOString(),
    };

    if (onAddNewListing) {
      await onAddNewListing(newListing);
    }

    // Reset Form
    setTitle('');
    setPrice('');
    setAgeMonths('');
    setDescription('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setIsUploading(false);
    setViewTab('manage');
  };

  const conditionsList = RE_COMMERCE_CONDITIONS || [
    { id: 'like_new', label: 'Like New (बिल्कुल नया)' },
    { id: 'good', label: 'Good (अच्छी स्थिति)' },
    { id: 'fair', label: 'Fair (काम चलाऊ)' },
  ];

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto text-slate-800 animate-fade-in pb-24 select-none">
      
      {/* 🌟 1. TOP APP BAR */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-black text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Re-Commerce Hub
          </span>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            पुराना सामान बेचें व मैनेज करें
          </h2>
        </div>
        <button
          type="button"
          onClick={onBackToHub}
          className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl active:scale-95 transition cursor-pointer"
        >
          ← Exit
        </button>
      </div>

      {/* 🌟 2. TABS */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setViewTab('add')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
            viewTab === 'add' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          ➕ Post New Item
        </button>
        <button
          type="button"
          onClick={() => setViewTab('manage')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
            viewTab === 'manage' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          📋 My Listings ({myListings.length})
        </button>
      </div>

      {/* 🌟 VIEW A: CREATE LISTING */}
      {viewTab === 'add' && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3.5"
        >
          {/* Subcategory */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
              Category
            </label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-hidden"
            >
              <option value="mobiles">📱 Mobiles & Gadgets</option>
              <option value="vehicles">🛵 Bikes & Scooters</option>
              <option value="appliances">❄️ Appliances (AC, TV, Cooler)</option>
              <option value="furniture">🪑 Furniture (Beds, Sofa, Almirah)</option>
              <option value="others">📦 Other Household</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
              Item Title & Model *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Samsung Galaxy M31 (6GB / 128GB)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-hidden focus:border-teal-600"
            />
          </div>

          {/* Price & Age */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                required
                placeholder="₹ 9,500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-hidden focus:border-teal-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Age (Months Old)
              </label>
              <input
                type="number"
                placeholder="10"
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-hidden"
              />
            </div>
          </div>

          {/* Condition Pills */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
              Condition
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {conditionsList.map((cond) => (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => setCondition(cond.id)}
                  className={`p-2 rounded-xl text-center border text-[10px] font-black transition cursor-pointer ${
                    condition === cond.id
                      ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {cond.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="w-4 h-4 rounded-sm text-teal-600"
              />
              <span className="text-xs font-bold text-slate-700">Negotiable Price</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBillOrBox}
                onChange={(e) => setHasBillOrBox(e.target.checked)}
                className="w-4 h-4 rounded-sm text-teal-600"
              />
              <span className="text-xs font-bold text-slate-700">Bill / Box Available</span>
            </label>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Vikram Singh"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-hidden"
              />
            </div>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-hidden"
              />
            </div>
          </div>

          {/* Landmark */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
              Local Area / Landmark
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
              Description / Notes
            </label>
            <textarea
              rows="2"
              placeholder="Any flaws, accessories included, reason for selling..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-hidden"
            />
          </div>

          {/* Multi-Photo Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 block">
              Photos ({previewUrls.length}/5)
            </label>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previewUrls.map((src, i) => (
                  <div
                    key={i}
                    className="relative h-18 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                  >
                    <img src={src} alt="Thumb" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 rounded-sm">
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
                className="border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/30 rounded-2xl p-3 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 transition"
              >
                <span className="text-base">📸</span>
                <span className="text-xs font-bold text-teal-800">
                  + Add Photos (Select Multiple)
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

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
          >
            {isUploading ? 'Uploading Photos...' : '🚀 Publish in Town 5 km Feed'}
          </button>
        </form>
      )}

      {/* 🌟 VIEW B: MANAGE MY LISTINGS */}
      {viewTab === 'manage' && (
        <div className="space-y-3">
          {myListings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-2">
              <div className="text-3xl">🏷️</div>
              <h4 className="text-sm font-black text-slate-800">No active listings yet</h4>
              <button
                type="button"
                onClick={() => setViewTab('add')}
                className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-black shadow-sm active:scale-95 cursor-pointer"
              >
                Post Your First Item
              </button>
            </div>
          ) : (
            myListings.map((item) => {
              const gallery =
                item.images && item.images.length > 0
                  ? item.images
                  : item.image
                  ? [item.image]
                  : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=700'];

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedListing(item)}
                  className="bg-white p-3.5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md flex items-center justify-between gap-3 transition cursor-pointer active:scale-99"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={gallery[0]}
                      alt={item.title}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <div className="text-xs font-black text-teal-700 mt-0.5">
                        {item.price}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.status === 'ACTIVE' ? '🟢 Active' : '⚪ Sold Out'}
                        </span>
                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                          ⭐ {item.interestCount || item.interest_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hyperlocalStore.recordLeadAction(item, 'share');
                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://apkekareeb.com';
                        const deepLink = `${baseUrl}/?listing=${encodeURIComponent(String(item.id))}`;
                        const shareText = `📦 *${item.title}* (${item.price})\n📍 ${item.location || selectedCity}\nAbhi ApkeKareeb par photo dekhein aur chat karein:\n${deepLink}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition active:scale-95 cursor-pointer flex items-center space-x-1"
                      title="Share to WhatsApp Status"
                    >
                      <span>📲</span>
                      <span className="hidden xs:inline">Share</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (String(item.status || '').toUpperCase() === 'ACTIVE') {
                          hyperlocalStore.markListingAsSold(item.id);
                        } else {
                          hyperlocalStore.insertListing('recommerce', {
                            ...item,
                            status: 'ACTIVE',
                            sold_at: null,
                          });
                        }
                        if (onToggleStatus) onToggleStatus(item.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition active:scale-95 cursor-pointer ${
                        String(item.status || '').toUpperCase() === 'ACTIVE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {String(item.status || '').toUpperCase() === 'ACTIVE' ? 'Mark Sold' : 'Relist'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 🌟 Detail View Modal on Card Click */}
      {selectedListing && (
        <ListingDetailModal
          item={selectedListing}
          selectedCity={selectedCity}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
}