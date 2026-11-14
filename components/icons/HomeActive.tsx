// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const HomeActive = (props: SvgProps) => <Svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24" {...props}><Path fill="#0D0D0D" d="M.268 11.925c0 .482.382.773.854.773.29 0 .522-.14.723-.341l9.803-8.93a.496.496 0 0 1 .713 0l9.794 8.93c.211.2.442.341.723.341.472 0 .854-.291.854-.773a.82.82 0 0 0-.301-.663l-3.476-3.164V2.16c0-.442-.28-.723-.723-.723h-1.316c-.432 0-.733.281-.733.723v3.415L13.205 1.94A1.76 1.76 0 0 0 12 1.448c-.422 0-.844.16-1.205.492L.569 11.262c-.18.17-.301.361-.301.663m2.873 8.427c0 1.396.843 2.21 2.26 2.21h4.068V15.42c0-.462.311-.763.773-.763h3.546c.462 0 .763.301.763.763v7.142h4.058c1.417 0 2.25-.814 2.25-2.21V13l-8.528-7.684a.52.52 0 0 0-.351-.15c-.11 0-.221.05-.342.16L3.141 13.05z" /></Svg>;
export default HomeActive;