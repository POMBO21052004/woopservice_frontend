// FeatherIcon.jsx
import React from 'react';
import feather from 'feather-icons';

const FeatherIcon = ({ icon, className, style, ...props }) => {
  if (!feather.icons[icon]) {
    console.warn(`Feather icon "${icon}" not found.`);
    return null;
  }
  const svgString = feather.icons[icon].toSvg({ class: className, style: style, ...props });
  return <div dangerouslySetInnerHTML={{ __html: svgString }} />;
};

export default FeatherIcon;