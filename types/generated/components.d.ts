import type { Schema, Struct } from '@strapi/strapi';

export interface SectionsConfigurator extends Struct.ComponentSchema {
  collectionName: 'components_sections_configurators';
  info: {
    description: 'Embeds the external 3D configurator via iframe';
    displayName: 'Configurator';
    icon: 'cube';
  };
  attributes: {
    body: Schema.Attribute.Text;
    eyebrow: Schema.Attribute.String;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    iframeUrl: Schema.Attribute.String;
  };
}

export interface SectionsContactInfo extends Struct.ComponentSchema {
  collectionName: 'components_sections_contact_infos';
  info: {
    description: 'Contact details for footer/contact page';
    displayName: 'Contact Info';
    icon: 'phone';
  };
  attributes: {
    addressLines: Schema.Attribute.Text;
    email: Schema.Attribute.Email;
    phone: Schema.Attribute.String;
  };
}

export interface SectionsFeatureCard extends Struct.ComponentSchema {
  collectionName: 'components_sections_feature_cards';
  info: {
    description: 'Product feature with image, metrics and copy';
    displayName: 'Feature Card';
    icon: 'stack';
  };
  attributes: {
    body: Schema.Attribute.Text;
    cta: Schema.Attribute.Component<'shared.cta', false>;
    eyebrow: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    metrics: Schema.Attribute.Component<'shared.metric', true>;
  };
}

export interface SectionsFeatureGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_feature_grids';
  info: {
    description: 'Heading + a set of feature cards';
    displayName: 'Feature Grid';
    icon: 'grid';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    features: Schema.Attribute.Component<'sections.feature-card', true>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    theme: Schema.Attribute.Enumeration<['dark', 'light']> &
      Schema.Attribute.DefaultTo<'light'>;
  };
}

export interface SectionsFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_sections_footer_columns';
  info: {
    description: 'A titled column of links in the footer';
    displayName: 'Footer Column';
    icon: 'layout';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heroes';
  info: {
    description: 'Full-bleed hero with background video/image';
    displayName: 'Hero';
    icon: 'landscape';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<'images'>;
    backgroundVideo: Schema.Attribute.Media<'videos'>;
    cta: Schema.Attribute.Component<'shared.cta', false>;
    eyebrow: Schema.Attribute.String;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    subheading: Schema.Attribute.Text;
  };
}

export interface SectionsImageBanner extends Struct.ComponentSchema {
  collectionName: 'components_sections_image_banners';
  info: {
    description: 'Full-bleed parallax image with heading';
    displayName: 'Image Banner';
    icon: 'picture';
  };
  attributes: {
    body: Schema.Attribute.Text;
    cta: Schema.Attribute.Component<'shared.cta', false>;
    eyebrow: Schema.Attribute.String;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    parallax: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface SectionsNewsletter extends Struct.ComponentSchema {
  collectionName: 'components_sections_newsletters';
  info: {
    description: 'Email subscribe form';
    displayName: 'Newsletter';
    icon: 'envelop';
  };
  attributes: {
    body: Schema.Attribute.Text;
    consentLabel: Schema.Attribute.String;
    emailLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Email'>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    submitLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Subscribe'>;
    successMessage: Schema.Attribute.String;
  };
}

export interface SectionsPartners extends Struct.ComponentSchema {
  collectionName: 'components_sections_partners';
  info: {
    description: 'Industry partner logo gallery';
    displayName: 'Partners';
    icon: 'briefcase';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    partners: Schema.Attribute.Relation<'oneToMany', 'api::partner.partner'>;
  };
}

export interface SectionsStatement extends Struct.ComponentSchema {
  collectionName: 'components_sections_statements';
  info: {
    description: 'Eyebrow + heading + body with optional side image';
    displayName: 'Statement';
    icon: 'quote';
  };
  attributes: {
    body: Schema.Attribute.Text;
    cta: Schema.Attribute.Component<'shared.cta', false>;
    eyebrow: Schema.Attribute.String;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    layout: Schema.Attribute.Enumeration<['imageLeft', 'imageRight']> &
      Schema.Attribute.DefaultTo<'imageRight'>;
    theme: Schema.Attribute.Enumeration<['dark', 'light']> &
      Schema.Attribute.DefaultTo<'dark'>;
  };
}

export interface SectionsStats extends Struct.ComponentSchema {
  collectionName: 'components_sections_stats';
  info: {
    description: 'Animated number counters';
    displayName: 'Stats';
    icon: 'chartBar';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    stats: Schema.Attribute.Component<'shared.metric', true>;
    theme: Schema.Attribute.Enumeration<['dark', 'light']> &
      Schema.Attribute.DefaultTo<'dark'>;
  };
}

export interface SharedCta extends Struct.ComponentSchema {
  collectionName: 'components_shared_ctas';
  info: {
    displayName: 'Cta';
    icon: 'cursor';
  };
  attributes: {
    external: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    href: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    style: Schema.Attribute.Enumeration<['primary', 'ghost']> &
      Schema.Attribute.DefaultTo<'primary'>;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    external: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    href: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedMetric extends Struct.ComponentSchema {
  collectionName: 'components_shared_metrics';
  info: {
    displayName: 'Metric';
    icon: 'chartCircle';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'sections.configurator': SectionsConfigurator;
      'sections.contact-info': SectionsContactInfo;
      'sections.feature-card': SectionsFeatureCard;
      'sections.feature-grid': SectionsFeatureGrid;
      'sections.footer-column': SectionsFooterColumn;
      'sections.hero': SectionsHero;
      'sections.image-banner': SectionsImageBanner;
      'sections.newsletter': SectionsNewsletter;
      'sections.partners': SectionsPartners;
      'sections.statement': SectionsStatement;
      'sections.stats': SectionsStats;
      'shared.cta': SharedCta;
      'shared.link': SharedLink;
      'shared.media': SharedMedia;
      'shared.metric': SharedMetric;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
    }
  }
}
