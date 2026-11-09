// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { XoArray, XoObject, XoProperty, XoTransient } from '@zeta/api';
import { XcComponentTemplate, XcTemplate } from '@zeta/xc';

import { XoComplexStorableTemplateComponent } from '../templates/xo-complex-storable-template/xo-complex-storable-template.component';


export interface XoComplexStorableTemplateData {
    obj: XoObject | XoArray;
}


export class XoComplexStorable extends XoObject {

    @XoProperty()
    @XoTransient()
    complexTemplate: XcTemplate[];


    static setTemplateData(obj: XoObject | XoArray): XcTemplate[] {
        return [
            new XcComponentTemplate(XoComplexStorableTemplateComponent, {obj})
        ];
    }
}
