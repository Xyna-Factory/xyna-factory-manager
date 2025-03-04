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
import { Component, InjectionToken } from '@angular/core';

import { XoArray, XoObject } from '@zeta/api';
import { XC_COMPONENT_DATA, XcDynamicComponent } from '@zeta/xc';

import { XoComplexStorableTemplateData } from '../../xo/xo-complex-storable.model';


// FIXME: Must be named "XcComplex..." instead of "XoComplex..."

@Component({
    selector: 'xo-complex-storable-template',
    templateUrl: './xo-complex-storable-template.component.html',
    styleUrls: ['./xo-complex-storable-template.component.scss'],
    standalone: false
})
export class XoComplexStorableTemplateComponent extends XcDynamicComponent<XoComplexStorableTemplateData> {
    get obj(): XoObject | XoArray | Array<any> {
        return this.injectedData.obj;
    }

    get length(): number {
        if (Array.isArray(this.obj)) {
            return this.obj.length;
        }
        if (Array.isArray(this.obj.data)) {
            return this.obj.data.length;
        }
        return -1;
    }

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }
}
