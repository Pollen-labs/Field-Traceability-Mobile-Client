// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

interface SafeAreaContentProps {
  children: React.ReactNode;
  className?: string;
}

const SafeAreaContent = ({ children, className = "" }: SafeAreaContentProps) => {
  return (
    <SafeAreaView 
      className={`flex-1 px-4 pt-2 bg-white-sand ${className}`}
      edges={['top', 'left', 'right']}
    >
      {children}
    </SafeAreaView>
  );
};

export default SafeAreaContent;
