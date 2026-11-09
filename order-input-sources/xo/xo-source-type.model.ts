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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoUnique } from '@zeta/api';

import { ORDER_INPUT_SOURCE_TYPE_CONSTANT_NAME_PREFIX, ORDER_INPUT_SOURCE_TYPE_WORKFLOW_NAME_PREFIX, ORDER_INPUT_SOURCE_TYPE_XTF_NAME_PREFIX } from '../restorable-order-input-sources.component';


@XoObjectClass(null, 'xmcp.factorymanager.orderinputsources', 'SourceType')
export class XoSourceType extends XoObject {


    @XoProperty()
    @XoUnique()
    name: string;


    @XoProperty()
    label: string;


    equals(other: XoSourceType): boolean {

        if (!other) {
            return false;
        }

        if (this.uniqueKey === other.uniqueKey) {
            return true;
        }

        const prefixKeys = [
            ORDER_INPUT_SOURCE_TYPE_CONSTANT_NAME_PREFIX,
            ORDER_INPUT_SOURCE_TYPE_WORKFLOW_NAME_PREFIX,
            ORDER_INPUT_SOURCE_TYPE_XTF_NAME_PREFIX
        ];
        let prefix;
        for (prefix of prefixKeys) {
            if ((this.uniqueKey.indexOf(prefix) >= 0) && (other.uniqueKey.indexOf(prefix) >= 0)) {
                return true;
            }
        }
        return false;
    }

}

@XoArrayClass(XoSourceType)
export class XoSourceTypeArray extends XoArray<XoSourceType> {
}
