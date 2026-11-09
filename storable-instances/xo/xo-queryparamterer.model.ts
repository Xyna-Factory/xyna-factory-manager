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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoSortCriterionArray } from './xo-sortcriterion.model';


@XoObjectClass(null, 'xnwh.persistence', 'QueryParameter')
export class XoQueryParameter extends XoObject {

    @XoProperty()
    maxObjects: number;

    @XoProperty()
    queryHistory: boolean;

    @XoProperty(XoSortCriterionArray)
    sortCriterion: XoSortCriterionArray;


    constructor(_ident?: string, maxObjects = -1, queryHistory = false, sortCriterion = new XoSortCriterionArray()) {
        super(_ident);
        this.maxObjects = maxObjects;
        this.queryHistory = queryHistory;
        this.sortCriterion = sortCriterion;
    }
}


@XoArrayClass(XoQueryParameter)
export class XoQueryParameterArray extends XoArray<XoQueryParameter> {
}
