import React from 'react';
import { CATEGORY_BANNER_REGISTRY } from '../../data/categoryBannerRegistry';
import { hyperlocalStore } from '../../store/hyperlocalStore';
import { getCurrentUserProfile } from '../../services/authService';

export default function CategoryListFreeBanner({
  category,
  selectedCity = 'Alwar',
  onPostClick,
  customIcon,
  customTitle,
  customDescription,
}) {
  const config = CATEGORY_BANNER_REGISTRY[category] || {
    icon: '🏪',
    title: 'List Your Business or Service Free',
    description: `Connect directly with customers across ${selectedCity}. Zero commission.`,
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-300',
  };

  const currentUser = getCurrentUserProfile();
  const quota = hyperlocalStore.checkPostingQuota(category, currentUser?.phone);

  const icon = customIcon || config.icon;
  const title = customTitle || (quota.requiresUpgrade ? `👑 Upgrade to ${quota.recommendedPlan?.name}` : config.title);

  const quotaNotice = currentUser?.phone
    ? quota.requiresUpgrade
      ? `You reached your free limit (${quota.freeLimit} listings). Tap to upgrade.`
      : `${quota.remainingFree} free listing slot(s) remaining in this category.`
    : '';

  const description = quotaNotice || (customDescription || config.description).replace('{city}', selectedCity);

  return (
    <div
      onClick={onPostClick}
      className={`bg-slate-900/90 border ${config.borderColor} rounded-3xl p-4 sm:p-5 flex items-center justify-between space-x-3 cursor-pointer active:scale-[0.98] hover:border-amber-400/70 transition-all shadow-xl group select-none`}
    >
      <div className="flex items-start space-x-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className={`text-xs sm:text-sm font-black ${config.textColor} leading-snug`}>
            {title}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onPostClick) onPostClick();
        }}
        className={`px-3.5 py-2 font-black text-xs rounded-xl shadow-md active:scale-95 transition whitespace-nowrap shrink-0 cursor-pointer ${
          quota.requiresUpgrade
            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950'
            : 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950'
        }`}
      >
        {quota.requiresUpgrade ? 'Upgrade Plan ➔' : 'List Free ➔'}
      </button>
    </div>
  );
}