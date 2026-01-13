/* eslint-disable no-unused-vars */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { KidsStoryManifestItem } from '../types/kidsStory';

// Ensures this file is treated as a module under `isolatedModules` in CRA/Babel builds.
export {};

type Props = {
  isOpen: boolean;
  stories: KidsStoryManifestItem[];
  onSelectStory: (story: KidsStoryManifestItem) => void;
  onClose: () => void;
};

export default function StoryPickerOverlay({
  isOpen,
  stories,
  onSelectStory,
  onClose,
}: Props) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="KidsOverlay" role="dialog" aria-modal="true">
      <div className="KidsOverlayHeader">
        <div className="KidsOverlayTitle">{t('kids.ui.selectStory')}</div>
        <button className="KidsButton" type="button" onClick={onClose}>
          {t('kids.ui.close')}
        </button>
      </div>

      <div className="KidsStoryGrid" role="list">
        {stories.map((story) => (
          <button
            key={story.id}
            className="KidsStoryCard"
            type="button"
            onClick={() => onSelectStory(story)}
            role="listitem"
          >
            <div className="KidsStoryCardImageWrap">
              <img
                className="KidsStoryCardImage"
                src={story.coverImageUrl}
                alt=""
                draggable={false}
              />
            </div>

            <div className="KidsStoryCardTitle">{t(story.titleKey)}</div>

            {story.isPlaceholder ? (
              <div className="KidsStoryCardBadge">{t('kids.ui.placeholder')}</div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}