# DownloadModal with AdSense Integration

This implementation provides a production-ready download modal with AdSense monetization for PdfPage.

## Features

✅ **5-second countdown timer** with progress bar  
✅ **Google AdSense integration** with fallback support  
✅ **Responsive design** for desktop and mobile  
✅ **Accessible** with proper ARIA labels and keyboard navigation  
✅ **Production-ready** with error handling and loading states  
✅ **Easy integration** into existing download flows

## Quick Setup

### 1. Environment Variables

Add your AdSense publisher ID to your environment variables:

```bash
# .env.local or .env
VITE_ADSENSE_PUBLISHER_ID=ca-pub-1234567890123456
```

### 2. Basic Integration

```tsx
import DownloadModal from "@/components/modals/DownloadModal";
import { useDownloadModal } from "@/hooks/useDownloadModal";

function MyComponent() {
  const downloadModal = useDownloadModal({
    countdownSeconds: 5,
    adSlot: "1234567890", // Your AdSense ad slot ID
    showAd: true,
  });

  const handleDownload = () => {
    downloadModal.openDownloadModal(
      () => {
        // Your download logic
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        link.click();
      },
      {
        fileName: "my-file.pdf",
        fileSize: "2.5 MB",
        title: "🎉 File ready!",
        description: "Download will start automatically.",
      },
    );
  };

  return (
    <div>
      <button onClick={handleDownload}>Download</button>
      <DownloadModal {...downloadModal.modalProps} />
    </div>
  );
}
```

## Components

### DownloadModal

Main modal component with countdown timer, ad container, and download controls.

**Props:**

- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Called when modal should close
- `onDownload: () => void` - Called to trigger actual download
- `fileName?: string` - Display name for the file
- `fileSize?: string` - Display size for the file
- `countdownSeconds?: number` - Countdown duration (default: 5)
- `adSlot?: string` - AdSense ad slot ID
- `showAd?: boolean` - Whether to show ads (default: true)
- `title?: string` - Modal title
- `description?: string` - Modal description

### DownloadAdSense

AdSense-specific component optimized for download modals.

**Props:**

- `adSlot: string` - AdSense ad slot ID
- `adFormat?: "auto" | "rectangle" | "vertical" | "horizontal" | "banner"` - Ad format
- `onAdLoad?: () => void` - Called when ad loads successfully
- `onAdError?: () => void` - Called when ad fails to load
- `fallbackContent?: React.ReactNode` - Content to show if ad fails

### useDownloadModal Hook

React hook that manages modal state and provides helper functions.

**Options:**

- `countdownSeconds?: number` - Countdown duration
- `adSlot?: string` - AdSense ad slot ID
- `showAd?: boolean` - Whether to show ads
- `autoClose?: boolean` - Auto close after download

**Returns:**

- `isModalOpen: boolean` - Current modal state
- `modalProps: object` - Props to pass to DownloadModal component
- `openDownloadModal: (downloadFn, options) => void` - Opens modal with download function
- `closeDownloadModal: () => void` - Manually close modal
- `wrapDownloadAction: (downloadFn, options) => () => void` - Helper to wrap existing download functions

## Ad Configuration

### Ad Formats Supported

- **Rectangle** (300x250) - Default, works best in modals
- **Banner** (728x90) - Good for wider screens
- **Auto** - Responsive, adapts to container
- **Vertical** (160x600) - For sidebar placements
- **Horizontal** (728x90) - Alternative banner format

### Development Mode

In development, the component shows a placeholder instead of real ads:

```
📺 Advertisement (Development Mode)
Google AdSense Preview
Format: rectangle | Slot: 1234567890
🎯
```

### Production Setup

1. **Get AdSense approval** for your domain
2. **Create ad units** in your AdSense dashboard
3. **Copy the ad slot IDs** for each ad unit
4. **Set environment variable** with your publisher ID
5. **Test on staging** before deploying to production

## Customization

### Custom Countdown Time

```tsx
const downloadModal = useDownloadModal({
  countdownSeconds: 10, // 10 seconds instead of 5
});
```

### Disable Ads for Premium Users

```tsx
const downloadModal = useDownloadModal({
  showAd: !user?.isPremium, // No ads for premium users
});
```

### Custom Ad Slots by Tool

```tsx
const downloadModal = useDownloadModal({
  adSlot: toolName === "merge" ? "merge-ad-slot" : "general-ad-slot",
});
```

### Custom Fallback Content

```tsx
<DownloadAdSense
  adSlot="1234567890"
  fallbackContent={
    <div className="text-center py-8">
      <h3>Thank you for using PdfPage! 🎉</h3>
      <p>Your download will start in {timeLeft} seconds</p>
    </div>
  }
/>
```

## Best Practices

### 1. User Experience

- **Keep countdown short** (3-7 seconds) to avoid frustration
- **Show progress** with progress bar and countdown
- **Allow skip option** for users who want to download immediately
- **Provide clear messaging** about what's happening

### 2. Ad Performance

- **Use appropriate ad sizes** - Rectangle (300x250) works best in modals
- **Test different placements** to find what works for your users
- **Monitor ad load times** and provide fallbacks
- **Respect user preferences** (premium users, ad blockers)

### 3. Accessibility

- **Focus management** - Modal traps focus appropriately
- **Keyboard navigation** - All controls accessible via keyboard
- **Screen reader support** - Proper ARIA labels and descriptions
- **Color contrast** - Meets WCAG guidelines

### 4. Technical

- **Error handling** - Graceful degradation when ads fail
- **Memory cleanup** - Proper cleanup of blob URLs and timers
- **Mobile optimization** - Touch-friendly controls and responsive design
- **Performance** - Minimal impact on page load and rendering

## Troubleshooting

### Ad Not Loading

1. **Check environment variables** - Ensure `VITE_ADSENSE_PUBLISHER_ID` is set
2. **Verify ad slot ID** - Ensure the slot exists in your AdSense account
3. **Check domain approval** - Ensure your domain is approved for AdSense
4. **Test in production** - AdSense may not load on localhost

### Modal Not Opening

1. **Check modal props** - Ensure `{...downloadModal.modalProps}` is spread correctly
2. **Verify state** - Check that `downloadModal.isModalOpen` becomes true
3. **Check console** - Look for JavaScript errors
4. **Test download function** - Ensure the download callback is valid

### Download Not Starting

1. **Check file URL** - Ensure the URL is valid and accessible
2. **Verify CORS** - Ensure the file can be downloaded from your domain
3. **Test blob URLs** - Check that blob URLs are created correctly
4. **Check browser security** - Some browsers block automatic downloads

## Support

For issues or questions:

1. Check the browser console for errors
2. Verify your AdSense setup and approval status
3. Test with ads disabled to isolate the issue
4. Check network requests to see if ads are being requested

## Examples

See `DownloadModalExample.tsx` for a complete working example with both integration methods.

Already integrated in:

- ✅ `src/pages/Merge.tsx` - PDF merging tool
- ✅ `src/pages/Compress.tsx` - PDF compression tool

Ready to integrate into any other tool that has download functionality!
