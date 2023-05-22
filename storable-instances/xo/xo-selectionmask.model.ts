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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';


@XoObjectClass(null, 'xnwh.persistence', 'SelectionMask')
export class XoSelectionMask extends XoObject {

    @XoProperty()
    rootType: string;

    @XoProperty()
    columns: string[];


    constructor(_ident?: string, rootType = '', columns = []) {
        super(_ident);
        this.rootType = rootType;
        this.columns = columns;
    }
}


@XoArrayClass(XoSelectionMask)
export class XoSelectionMaskArray extends XoArray<XoSelectionMask> {
}
