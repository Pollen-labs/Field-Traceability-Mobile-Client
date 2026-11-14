// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SettingsActive = (props: SvgProps) => <Svg xmlns="http://www.w3.org/2000/svg" width={25} height={24} fill="none" viewBox="0 0 25 24" {...props}><Path fill="#0D0D0D" fillRule="evenodd" d="M9.934 22.043a10.2 10.2 0 0 1-2.947-1.155l.053-1.039c.072-1.417-1.022-2.507-2.435-2.435l-1.15.058a10.2 10.2 0 0 1-1.222-2.793l.902-.813c1.053-.951 1.05-2.496 0-3.444l-.962-.868c.24-.979.618-1.902 1.114-2.748l1.318.067c1.417.073 2.507-1.021 2.435-2.435L6.973 3.12c.846-.496 1.769-.874 2.747-1.113l.868.961c.951 1.054 2.496 1.051 3.444 0l.814-.901c1 .269 1.939.684 2.793 1.222l-.059 1.15c-.072 1.416 1.022 2.507 2.436 2.434l1.039-.053a10.2 10.2 0 0 1 1.154 2.948l-.724.654c-1.053.95-1.05 2.495 0 3.444l.669.603a10.2 10.2 0 0 1-1.268 2.99l-.87-.045c-1.418-.073-2.508 1.021-2.436 2.435l.045.87a10.2 10.2 0 0 1-2.99 1.268l-.603-.668c-.951-1.054-2.495-1.05-3.444 0zm2.233-5.757a4.286 4.286 0 1 0 0-8.572 4.286 4.286 0 0 0 0 8.572" clipRule="evenodd" /></Svg>;
export default SettingsActive;