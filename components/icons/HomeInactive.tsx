// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const HomeInactive = (props: SvgProps) => <Svg xmlns="http://www.w3.org/2000/svg" width={24} height={25} fill="none" viewBox="0 0 24 25" {...props}><Path fill="#8E8E93" d="M5.41 22.894H18.6c1.426 0 2.26-.804 2.26-2.22v-9.17l1.295 1.184c.211.201.442.342.723.342.473 0 .854-.291.854-.774a.82.82 0 0 0-.301-.662l-3.486-3.185V2.493c0-.442-.28-.723-.723-.723h-1.316c-.432 0-.733.281-.733.723v3.395l-3.968-3.616c-.351-.321-.773-.502-1.205-.502s-.854.18-1.205.502L.569 11.594c-.18.17-.301.361-.301.662 0 .483.382.774.854.774.291 0 .522-.14.723-.342l1.296-1.175v9.16c0 1.417.833 2.22 2.27 2.22m9.483-8.287c0-.462-.301-.753-.764-.753H9.872c-.462 0-.774.29-.774.753v6.67H5.752c-.643 0-.994-.352-.994-1.005V10.037l6.89-6.278c.101-.1.222-.161.352-.161s.251.05.362.16l6.88 6.279v10.235c0 .653-.351 1.005-.984 1.005h-3.365z" /></Svg>;
export default HomeInactive;