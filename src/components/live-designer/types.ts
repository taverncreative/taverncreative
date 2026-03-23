export interface DesignerField {
  label: string;
  placeholder: string;
  font_size: number;
  font_family: string;
  y_mm: number;
  field_type: string;
  is_required: boolean;
  sort_order: number;
  is_uppercase?: boolean;
  font_weight?: number;
  is_highlight_colour?: boolean;
  text_colour?: string;
  scale_y?: number;
  text_width_pct?: number;
  allow_wrap?: boolean;
  letter_spacing?: number;
  text_stroke?: number;
}

export interface LiveDesignerProps {
  fields: DesignerField[];
  collectionSlug: string;
  collectionName: string;
  artWidthMm: number;
  artHeightMm: number;
  highlightColour: string;
  customerSwatches: string[];
  customerValues: Record<string, string>;
  showHeart: boolean;
  selectedColour: string;
  onValueChange: (label: string, value: string) => void;
  onColourChange: (colour: string) => void;
  onSwatchesExtracted?: (swatches: string[]) => void;
  onFieldClick?: (fieldLabel: string) => void;
}

export interface FontRegistryEntry {
  family: string;
  file: string;
  weight: string;
  style: string;
}

export interface ComputedField {
  index: number;
  label: string;
  text: string;
  fontFamily: string;
  baseFontPx: number;
  finalFontPx: number;
  fontWeight: number;
  isUppercase: boolean;
  scaleY: number;
  colour: string;
  fieldType: string;
  renderedWidth: number;
  renderedHeight: number;
  computedY: number;
  letterSpacing: number;
  textStroke: number;
}
