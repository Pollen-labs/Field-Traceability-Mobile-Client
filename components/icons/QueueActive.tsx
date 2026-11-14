// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import * as React from "react";
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const QueueActive = (props: SvgProps) => <Svg xmlns="http://www.w3.org/2000/svg" width={25} height={24} fill="none" viewBox="0 0 25 24" {...props}><G clipPath="url(#a)"><Path fill="#0D0D0D" d="M12.088 15.079a.8.8 0 0 0 .794-.784V4.07l-.06-1.507.673.713 1.526 1.617c.14.161.352.241.543.241.422 0 .733-.29.733-.703 0-.21-.09-.371-.241-.522L12.67.625c-.211-.201-.382-.262-.583-.262-.21 0-.381.06-.582.262L8.11 3.909c-.151.15-.242.311-.242.522 0 .412.302.703.724.703.19 0 .412-.08.552-.24l1.527-1.618.673-.713-.06 1.507v10.225c0 .422.371.784.803.784M3.39 23.637h17.387c2.1 0 3.154-1.045 3.154-3.114v-5.545c0-.904-.13-1.336-.573-1.908l-3.375-4.31c-1.215-1.556-1.697-1.868-3.475-1.868H14.73V8.3h1.888c.734 0 1.216.13 1.788.863l3.466 4.5c.391.513.26.714-.292.714h-6.197c-.553 0-.824.422-.824.874v.03c0 1.235-.964 2.54-2.48 2.54-1.508 0-2.472-1.305-2.472-2.54v-.03c0-.453-.271-.874-.823-.874H2.596c-.572 0-.663-.242-.301-.714l3.445-4.47C6.333 8.44 6.815 8.3 7.548 8.3h1.899V6.892H7.659c-1.778 0-2.25.312-3.496 1.899L.808 13.07c-.442.572-.572 1.004-.572 1.908v5.545c0 2.08 1.064 3.114 3.154 3.114" /></G><Defs><ClipPath id="a"><Path fill="#fff" d="M.083 0h24v24h-24z" /></ClipPath></Defs></Svg>;
export default QueueActive;