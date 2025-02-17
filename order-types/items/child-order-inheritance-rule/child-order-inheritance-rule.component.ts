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
import { Component, Injector } from '@angular/core';

import { XcRichListItemComponent } from '@zeta/xc';

import { XoParameterInheritanceRule } from '../../../xo/xo-parameter-inheritance-rule.model';


export interface ChildOrderInheritanceRuleComponentData {
    rule: XoParameterInheritanceRule;
}


@Component({
    templateUrl: './child-order-inheritance-rule.component.html',
    styleUrls: ['./child-order-inheritance-rule.component.scss'],
    standalone: false
})
export class ChildOrderInheritanceRuleComponent extends XcRichListItemComponent<void, ChildOrderInheritanceRuleComponentData> {

    constructor(injector: Injector) {
        super(injector);
    }
}
