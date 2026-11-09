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
import { XoTableColumn, XoTableInfo } from '@zeta/xc';


export class XoOrderTypeCapacitiesTableInfo extends XoTableInfo {

    beforeEncode() {
        super.beforeEncode();

        // deleting the extra column
        if (this.columns) {
            this.columns.data.splice(this.columns.length - 2, 1);
            this.columns.data.splice(0, 1);
        }

    }

    afterDecode() {
        super.afterDecode();

        const col2 = new XoTableColumn();
        col2.name = 'Usage';
        col2.path = 'usageTemplate';
        col2.disableFilter = true;
        col2.disableSort = true;
        col2.shrink = true;
        this.columns.data.splice(this.columns.length - 1, 0, col2);

        const col = new XoTableColumn();
        col.name = 'Assigned';
        col.path = 'isRequiredTemplate';
        col.disableFilter = true;
        col.disableSort = true;
        col.shrink = true;
        this.columns.data.splice(0, 0, col);

        this.columns.data.forEach(tcol => tcol.shrink = true);
    }

}
