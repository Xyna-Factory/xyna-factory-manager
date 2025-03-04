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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { XoOrderCustoms } from '../../../xo/xo-ordercustoms.model';


@Component({
    selector: 'custom-information-form',
    templateUrl: './custom-information-form.component.html',
    standalone: false
})
export class CustomInformationFormComponent {
    _customFields: XoOrderCustoms;

    /**
     * @description The CustomInformationFormComponent has four custom inputs which can be fetche via the customFieldsChange event.
     * @returns A XoOrderCustoms.
     */
    @Output()
    readonly customFieldsChange = new EventEmitter<XoOrderCustoms>();

    @Input()
    get customFields(): XoOrderCustoms {
        return this._customFields;
    }

    set customFields(value: XoOrderCustoms) {
        this._customFields = value;
        this.customFieldsChange.emit(value);
    }
}
